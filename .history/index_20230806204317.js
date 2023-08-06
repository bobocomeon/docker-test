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

http.createServer(async (req, res) => {
  console.log('receive request')
  console.log(req.url);
  if (req.method === 'POST' && req.url === '/') {
    const data = await resolvePost(req);
    const projectDir = path.resolve(`./${data.repository.name}`);
    deleteFolderRecursive(projectDir)
    // 拉取仓库最新代码
    execSync(`git clone https://github.com/bobocomeon/${data.repository.name}.git ${projectDir}`,{
      stdio: 'inherit',
    })
    // 创建docker镜像
    execSync(`docker build . -t ${data.repository.name}-image:latest `, {
      stdio: 'inherit',
      cwd: projectDir
    })
    // 销毁docker容器
    execSync(`docker ps -a -f "name=^${data.repository.name}-container" --format="{{.Names}}" | xargs -r docker stop | xargs -r docker rm`, {
       stdio: 'inherit',
    })
    // 创建 docker 容器
    execSync(`docker run -d -p 8888:8008 --name ${data.repository.name}-container  ${data.repository.name}-image:latest`, {
      stdio:'inherit',
    })
    console.log('deploy success')
    res.end('ok')
  }
}).listen(3000, () => {
  console.log('server is ready')
})