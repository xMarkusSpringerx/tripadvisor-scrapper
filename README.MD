#WINDOWS
electron-packager . tripadvisor-scrapper --overwrite --asar=true --platform=win32 --arch=ia32 --prune=true --out=release-builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="Tripadvisor Scrapper"

#MAC
electron-packager . --overwrite --platform=darwin --arch=x64 --prune=true --out=release-builds
