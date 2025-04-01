# Image Stacking Software

## Project Overview

The Image Stacker is a Tauri and Rust-based desktop application designed to simplify the process of aligning and stacking astrophotography images. Leveraging computer vision techniques, this software enables users to enhance their night sky photos by reducing noise and improving detail. The target audience includes astrophotography enthusiasts, researchers, and hobbyists looking for a user-friendly yet robust solution.

## Key Features

1. **Automatic Image Alignment**:
   - Uses feature detection algorithms (e.g., ORB) to identify and match key points (stars) across multiple images.
   - Homography matrix calculation for accurate alignment of images with translations, rotations, and scaling corrections.
   - RANSAC for outlier rejection, ensuring robust matching.
2. **Image Stacking Techniques**:
   - **Averaging** for noise reduction and detail enhancement.
   - **Maximum Pixel Value** stacking for creative effects like star trails.
3. **Preprocessing Options**:
   - Automatic cropping of edges after alignment to handle image shifts.
   - Optional normalization and brightness adjustment for consistent stacking.
4. **User Interface**:
   - A modern UI built with Next.js and TailwindCSS for the frontend.
   - Tauri provides the native desktop capabilities and performance.
   - Simple, intuitive controls for loading images, adjusting parameters, and viewing results.
5. **Performance Optimization**:
   - Efficient processing using OpenCV and NumPy for large image datasets.

## Technical Stack

- **Programming Language**: Rust, TypeScript, Python

- **Libraries and Frameworks**:

  - Image Processing: OpenCV, PIL
  - Numerical Computation: NumPy
  - GUI Development: Tauri

- **Supported Formats**: JPEG, PNG, TIFF, FITS (optional for astrophotography use cases)

## Development Plan

### **Phase 1: Setup (2 weeks)**

- Learn about basics of astrophotography and image stacking.
- Get up to speed with Python with a basic assignment.

### **Phase 2: Core Functionality (1 month)**

- Develop image alignment using ORB and homography.
- Implement basic stacking methods (averaging, max value).

### **Phase 3: User Interface & Features (1 month)**

- Create a user-friendly GUI and add CLI functionality.
- Integrate preprocessing tools (cropping, normalization).

### **Phase 4: Optimization & Testing (2 weeks)**

- Optimize performance for large datasets.
- Perform extensive testing with sample images, including astrophotography datasets.

## Resources

- **Learning Python**:

  - **YouTube Channels**:

    - [Python Full Course for Beginners [2025]](https://www.youtube.com/watch?v=K5KVEU3aaeQ)
    - [Python for Beginners – Full Course [Programming Tutorial]](https://www.youtube.com/watch?v=eWRfhZUzrAc)

  - **Free Courses**:

    - [Harvard CS50’s Introduction to Programming with Python](https://cs50.harvard.edu/python/2022/) (Basic Level)

  - **Recommended Books**:
    - Python Crash Course: A Hands-On, Project-Based Introduction to Programming (2nd Edition)
    - Head-First Python: A Brain-Friendly Guide (2nd Edition)
    - Learn Python the Hard Way: 3rd Edition

- **Dataset**:

  - [AstroPix Practice Files](https://www.astropix.com/html/processing/practice_files.html)

- **ORB (Oriented FAST and Rotated BRIEF)**:

  - [Demystifying ORB (Oriented FAST and Rotated BRIEF) Feature Detector and Descriptor in OpenCV](https://gopesh3652.medium.com/demystifying-orb-oriented-fast-and-rotated-brief-feature-detector-and-descriptor-in-opencv-af11bfa135d0)
  - [Feature matching using ORB algorithm in Python-OpenCV](https://www.geeksforgeeks.org/feature-matching-using-orb-algorithm-in-python-opencv/)

- **FLANN Matcher**:

  - [Feature Matching with FLANN](https://docs.opencv.org/3.4/d5/d6f/tutorial_feature_flann_matcher.html)
  - [Python OpenCV – FlannBasedMatcher() Function](https://www.geeksforgeeks.org/python-opencv-flannbasedmatcher-function)

- **Affine Transformation**:

  - [Geometric Transformations of Images](https://docs.opencv.org/4.x/da/d6e/tutorial_py_geometric_transformations.html)
  - [What are affine transformations?](https://www.youtube.com/watch?v=E3Phj6J287o)

- **Learning Rust**:

  - [Rustlings](https://github.com/rust-lang/rustlings)
