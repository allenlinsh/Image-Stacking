// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use image::GenericImageView;
use opencv::core::{AlgorithmHint, DMatch, Ptr, Scalar, Vector};
use opencv::flann;
use opencv::{calib3d, core, features2d, imgcodecs, imgproc, prelude::*};
use serde::{Deserialize, Serialize};
use std::path::Path;

const MATCH_THRESHOLD: f32 = 0.8; // Lowe's ratio test threshold

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageInfo {
  path: String,
  width: u32,
  height: u32,
}

// Enum for matcher method selection
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MatcherMethod {
  Auto,  // Automatically select based on descriptor count
  BF,    // Brute Force
  FLANN, // Fast Library for Approximate Nearest Neighbors
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AlignmentParams {
  reference_image_path: String,
  image_paths: Vec<String>,
  feature_sensitivity: f32,
  min_matches: usize,
  allow_rotation: bool,
  matcher_method: Option<MatcherMethod>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AlignmentResult {
  aligned_paths: Vec<String>,
  skipped_paths: Vec<String>,
  method_used: String,
  debug_info: Vec<String>,
}

#[tauri::command]
async fn get_image_info(path: String) -> Result<ImageInfo, String> {
  // First check if the file exists
  if !Path::new(&path).exists() {
    return Err(format!("File does not exist: {}", path));
  }

  // Try to open and get image info with detailed error handling
  match image::open(&path) {
    Ok(img) => {
      let dimensions = img.dimensions();
      Ok(ImageInfo {
        path,
        width: dimensions.0,
        height: dimensions.1,
      })
    }
    Err(e) => Err(format!("Failed to load image '{}': {}", path, e)),
  }
}

// Helper function to create a FLANN-based matcher
fn create_flann_matcher() -> Result<Ptr<features2d::FlannBasedMatcher>, String> {
  // Create an index params object for LSH, suitable for binary descriptors like ORB
  let index_params = flann::LshIndexParams::new(12, 20, 2)
    .map_err(|e| format!("Error creating LSH index params: {}", e))?;

  // Create search params
  let search_params =
    flann::SearchParams::new_def().map_err(|e| format!("Error creating search params: {}", e))?;

  // Convert to IndexParams trait objects for proper type handling
  let index_params_trait: flann::IndexParams = index_params.into();
  let search_params_trait: flann::SearchParams = search_params.into();

  // Create Ptr objects that FlannBasedMatcher::new expects
  let index_params_ptr = core::Ptr::new(index_params_trait);
  let search_params_ptr = core::Ptr::new(search_params_trait);

  // Create FlannBasedMatcher using new method with our params
  let matcher = features2d::FlannBasedMatcher::new(&index_params_ptr, &search_params_ptr)
    .map_err(|e| format!("Error creating FLANN matcher: {}", e))?;

  // Create a Ptr to hold the matcher - doesn't need map_err as it doesn't return Result
  let matcher_ptr = core::Ptr::new(matcher);

  Ok(matcher_ptr)
}

// Helper function to create a Brute Force matcher
fn create_bf_matcher() -> Result<Ptr<features2d::BFMatcher>, String> {
  features2d::BFMatcher::create(core::NORM_HAMMING, false)
    .map_err(|e| format!("Error creating BF matcher: {}", e))
}

// Function to match features using FLANN matcher
fn match_features_flann(
  matcher: &mut Ptr<features2d::FlannBasedMatcher>,
  descriptors: &Mat,
  descriptors_ref: &Mat,
) -> Result<Vec<DMatch>, String> {
  let mut matches = Vector::<Vector<DMatch>>::new();
  matcher
    .knn_train_match(
      descriptors,
      descriptors_ref,
      &mut matches,
      2,
      &core::no_array(),
      false,
    )
    .map_err(|e| format!("Error matching features with FLANN: {}", e))?;

  // Apply Lowe's ratio test
  let mut good_matches = Vec::new();
  for i in 0..matches.len() {
    let match_pair = matches
      .get(i)
      .map_err(|e| format!("Error getting match: {}", e))?;
    if match_pair.len() >= 2 {
      let m = match_pair
        .get(0)
        .map_err(|e| format!("Error getting match: {}", e))?;
      let n = match_pair
        .get(1)
        .map_err(|e| format!("Error getting match: {}", e))?;
      if m.distance < MATCH_THRESHOLD * n.distance {
        good_matches.push(m.clone());
      }
    }
  }

  Ok(good_matches)
}

// Function to match features using BF matcher
fn match_features_bf(
  matcher: &mut Ptr<features2d::BFMatcher>,
  descriptors: &Mat,
  descriptors_ref: &Mat,
) -> Result<Vec<DMatch>, String> {
  let mut matches = Vector::<Vector<DMatch>>::new();
  matcher
    .knn_train_match(
      descriptors,
      descriptors_ref,
      &mut matches,
      2,
      &core::no_array(),
      false,
    )
    .map_err(|e| format!("Error matching features with BF: {}", e))?;

  // Apply Lowe's ratio test
  let mut good_matches = Vec::new();
  for i in 0..matches.len() {
    let match_pair = matches
      .get(i)
      .map_err(|e| format!("Error getting match: {}", e))?;
    if match_pair.len() >= 2 {
      let m = match_pair
        .get(0)
        .map_err(|e| format!("Error getting match: {}", e))?;
      let n = match_pair
        .get(1)
        .map_err(|e| format!("Error getting match: {}", e))?;
      if m.distance < MATCH_THRESHOLD * n.distance {
        good_matches.push(m.clone());
      }
    }
  }

  Ok(good_matches)
}

#[tauri::command]
async fn align_images(params: AlignmentParams) -> Result<AlignmentResult, String> {
  let mut aligned_paths = Vec::new();
  let mut skipped_paths = Vec::new();
  let mut debug_info = Vec::new();

  // Read reference image
  let ref_img = match imgcodecs::imread(&params.reference_image_path, imgcodecs::IMREAD_COLOR) {
    Ok(img) => img,
    Err(_) => {
      return Err(format!(
        "Failed to load reference image: {}",
        params.reference_image_path
      ))
    }
  };

  // Check if reference image is empty
  if ref_img.empty() {
    return Err(format!(
      "Reference image is empty or could not be read: {}",
      params.reference_image_path
    ));
  }

  // Convert reference to grayscale
  let mut ref_gray = Mat::default();
  imgproc::cvt_color(
    &ref_img,
    &mut ref_gray,
    imgproc::COLOR_BGR2GRAY,
    0,
    AlgorithmHint::ALGO_HINT_DEFAULT,
  )
  .map_err(|e| format!("Error converting to grayscale: {}", e))?;

  // Convert grayscale image to 8-bit (required for ORB)
  let mut ref_gray_8bit = Mat::default();
  opencv::core::normalize(
    &ref_gray,
    &mut ref_gray_8bit,
    0.0,
    255.0,
    opencv::core::NORM_MINMAX,
    opencv::core::CV_8U,
    &core::no_array(),
  )
  .map_err(|e| format!("Error normalizing grayscale image: {}", e))?;

  // Initialize ORB detector
  let nfeatures = (500.0 * params.feature_sensitivity) as i32;
  let mut orb = features2d::ORB::create(
    nfeatures,
    1.2,
    8,
    31,
    0,
    2,
    features2d::ORB_ScoreType::HARRIS_SCORE,
    31,
    20,
  )
  .map_err(|e| format!("Error creating ORB detector: {}", e))?;

  // Detect keypoints & descriptors in reference image
  let mut keypoints_ref = Vector::<core::KeyPoint>::new();
  let mut descriptors_ref = Mat::default();
  orb
    .detect_and_compute(
      &ref_gray_8bit,
      &core::no_array(),
      &mut keypoints_ref,
      &mut descriptors_ref,
      false,
    )
    .map_err(|e| format!("Error detecting keypoints in reference image: {}", e))?;

  // Determine which matcher to use
  let descriptor_count = keypoints_ref.len();
  let method_to_use = params.matcher_method.unwrap_or(MatcherMethod::Auto);

  // Select the matcher type and create it
  let (matcher_type, use_flann) = match method_to_use {
    MatcherMethod::BF => ("BF", false),
    MatcherMethod::FLANN => ("FLANN", true),
    MatcherMethod::Auto => {
      // Use FLANN for larger descriptor sets (> 1000), BF for smaller ones
      if descriptor_count > 1000 {
        ("FLANN (auto-selected)", true)
      } else {
        ("BF (auto-selected)", false)
      }
    }
  };

  // Create the appropriate matcher
  let mut flann_matcher = create_flann_matcher().ok();
  let mut bf_matcher = create_bf_matcher().ok();

  // Process each image
  for image_path in params.image_paths.iter() {
    // Skip if same as reference
    if image_path == &params.reference_image_path {
      aligned_paths.push(image_path.clone());
      debug_info.push(format!("Skipped reference image: {}", image_path));
      continue;
    }

    // Read image
    let img = match imgcodecs::imread(image_path, imgcodecs::IMREAD_COLOR) {
      Ok(img) => img,
      Err(_) => {
        debug_info.push(format!("Failed to load image: {}", image_path));
        skipped_paths.push(image_path.clone());
        continue;
      }
    };

    // Check if image is empty
    if img.empty() {
      debug_info.push(format!("Image is empty: {}", image_path));
      skipped_paths.push(image_path.clone());
      continue;
    }

    // Convert to grayscale
    let mut img_gray = Mat::default();
    imgproc::cvt_color(
      &img,
      &mut img_gray,
      imgproc::COLOR_BGR2GRAY,
      0,
      AlgorithmHint::ALGO_HINT_DEFAULT,
    )
    .map_err(|e| format!("Error converting image to grayscale: {}", e))?;

    // Convert 16-bit grayscale image to 8-bit for ORB
    let mut img_gray_8bit = Mat::default();
    opencv::core::normalize(
      &img_gray,
      &mut img_gray_8bit,
      0.0,
      255.0,
      opencv::core::NORM_MINMAX,
      opencv::core::CV_8U,
      &core::no_array(),
    )
    .map_err(|e| format!("Error normalizing image to 8-bit: {}", e))?;

    // Detect keypoints
    let mut keypoints = Vector::<core::KeyPoint>::new();
    let mut descriptors = Mat::default();
    orb
      .detect_and_compute(
        &img_gray_8bit,
        &core::no_array(),
        &mut keypoints,
        &mut descriptors,
        false,
      )
      .map_err(|e| format!("Error detecting keypoints: {}", e))?;

    // Match features using the selected method
    let good_matches = if use_flann {
      if let Some(ref mut matcher) = flann_matcher {
        match_features_flann(matcher, &descriptors, &descriptors_ref)?
      } else {
        debug_info.push("Failed to create FLANN matcher".to_string());
        return Err("Failed to create FLANN matcher".to_string());
      }
    } else {
      if let Some(ref mut matcher) = bf_matcher {
        match_features_bf(matcher, &descriptors, &descriptors_ref)?
      } else {
        debug_info.push("Failed to create BF matcher".to_string());
        return Err("Failed to create BF matcher".to_string());
      }
    };

    debug_info.push(format!(
      "Image: {}, Matches found: {}, Min required: {}",
      image_path,
      good_matches.len(),
      params.min_matches
    ));

    // Ensure we have enough matches
    if good_matches.len() >= params.min_matches {
      // Extract matched keypoints
      let mut src_points = Vec::new();
      let mut dst_points = Vec::new();

      for m in &good_matches {
        let query_idx = m.query_idx as usize;
        let train_idx = m.train_idx as usize;

        if query_idx < keypoints.len() && train_idx < keypoints_ref.len() {
          let pt1 = keypoints
            .get(query_idx)
            .map_err(|e| format!("Error getting keypoint: {}", e))?;
          let pt2 = keypoints_ref
            .get(train_idx)
            .map_err(|e| format!("Error getting keypoint: {}", e))?;

          src_points.push(pt1.pt());
          dst_points.push(pt2.pt());
        }
      }

      debug_info.push(format!("Valid points extracted: {}", src_points.len()));

      // Check if we have enough points before continuing
      if src_points.len() >= 3 {
        // Convert to OpenCV format suitable for estimateAffinePartial2D
        let src_pts_vec: Vector<core::Point2f> = Vector::from_iter(src_points.clone());
        let dst_pts_vec: Vector<core::Point2f> = Vector::from_iter(dst_points.clone());

        // Compute transformation matrix using RANSAC
        let method = if params.allow_rotation {
          calib3d::RANSAC
        } else {
          calib3d::LMEDS
        };

        // Compute Affine transformation (as in the Python notebook)
        let matrix = calib3d::estimate_affine_partial_2d(
          &src_pts_vec,
          &dst_pts_vec,
          &mut Mat::default(),
          method,
          3.0,
          2000,
          0.99,
          10,
        )
        .map_err(|e| format!("Error computing affine transform: {}", e))?;

        // Apply transformation
        let mut aligned_img = Mat::default();
        imgproc::warp_affine(
          &img,
          &mut aligned_img,
          &matrix,
          core::Size::new(ref_img.cols(), ref_img.rows()),
          imgproc::INTER_LINEAR,
          core::BORDER_CONSTANT,
          Scalar::new(0.0, 0.0, 0.0, 0.0),
        )
        .map_err(|e| format!("Error applying transformation: {}", e))?;

        // Create output filename
        let path = Path::new(image_path);
        let stem = path.file_stem().unwrap_or_default().to_string_lossy();
        let extension = path.extension().unwrap_or_default().to_string_lossy();
        let parent = path
          .parent()
          .unwrap_or_else(|| Path::new(""))
          .to_string_lossy();

        let output_path = format!("{}/aligned_{}.{}", parent, stem, extension);

        // Save aligned image
        imgcodecs::imwrite(&output_path, &aligned_img, &Vector::new())
          .map_err(|e| format!("Error saving aligned image: {}", e))?;

        aligned_paths.push(output_path);
      } else {
        debug_info.push(format!(
          "Not enough valid points (need at least 3): {}",
          src_points.len()
        ));
        skipped_paths.push(image_path.clone());
      }
    } else {
      debug_info.push(format!(
        "Not enough matches (has {}, needed ≥{})",
        good_matches.len(),
        params.min_matches
      ));
      skipped_paths.push(image_path.clone());
    }
  }

  Ok(AlignmentResult {
    aligned_paths,
    skipped_paths,
    method_used: matcher_type.to_string(),
    debug_info,
  })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![get_image_info, align_images,])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
