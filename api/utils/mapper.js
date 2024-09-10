const fs = require("fs");
const path = require("path");

const routeMapper = (directory) => {
  const routeMap = [];
  const dirVersions = fs.readdirSync(directory);

  for (const dir of dirVersions) {
    const dirPath = path.join(directory, dir);
    const files = fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith(".js"));

    for (const route of files) {
      const routeFile = require(path.join(dirPath, route));

      if (routeFile.data.params) {
        var params = routeFile.data.params
      }

      const basePath = path.join(
        "/api/",
        route.replace(".js", ""),
        params || "",
      );

      routeMap.push({
        ...routeFile,
        data: { ...routeFile.data, path: basePath }
      });

      if (routeFile.data.isWildcard) {
        routeMap.push({
          ...routeFile,
          data: { ...routeFile.data, path: path.join(basePath, "/*") }
        });
      }
    }
  }

  return routeMap;
};

module.exports = routeMapper;
