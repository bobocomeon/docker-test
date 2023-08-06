const http = require('http')
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// 敌对删除目录
function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      const curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath)
      } else {
        // deletefile
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

const resolvePost = req => 
  new Promise(resolve => {
    let chunk = '';
    req.on('data', data => {
      chunk += data;
    })
    req.on('end', () => {
      resolve(JSON.parse(chunk));
    })
  })

