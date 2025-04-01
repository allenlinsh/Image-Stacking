# Image Stacking Application

A desktop application built with Tauri 2.0 + Next.js 15 that allows for image stacking and processing.

## Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) with TypeScript
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Backend**: [Tauri 2.0](https://v2.tauri.app/) with Rust
- **Code Quality**:
  - Biome for TypeScript formatting and linting
  - ESLint for Next.js specific rules
  - Clippy and rustfmt for Rust code

## Development

To run the development environment:

```shell
pnpm tauri dev
```

### Building for Release

To export the Next.js frontend via SSG and build the Tauri application for release:

```shell
pnpm tauri build
```

This will create platform-specific installers in the `src-tauri/target/release` directory.

## Project Structure

- `src/` - Next.js frontend source files
- `src-tauri/` - Tauri Rust application source files
