fn main() {
    // `frontendDist` is gitignored; stub it so `generate_context!()` compiles before first `pnpm build`.
    let dist = std::path::Path::new("../dist");
    if !dist.exists() {
        std::fs::create_dir_all(dist).expect("failed to create ../dist");
    }
    let index = dist.join("index.html");
    if !index.exists() {
        std::fs::write(
            &index,
            r#"<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DevOS</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"#,
        )
        .expect("failed to write ../dist/index.html");
    }

    tauri_build::build()
}
