version=$(npm ls SvelteTurk | grep -Eo '\d.\d.\d')
gh release create "v$version" out/SvelteTurk-darwin-x64.zip -t $version