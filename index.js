const http = require("http")
const {execSync} = require("child_process")
const fs = require("fs")
const path = require("path")

// 递归删除目录
function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            const curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

const resolvePost = req =>
    new Promise(resolve => {
        let chunk = "";
        req.on("data", data => {
            chunk += data;
        });
        req.on("end", () => {
            resolve(JSON.parse(chunk));
        });
    });

http.createServer(async (req, res) => {
    console.log('receive request')
    console.log(req)
    if (req.method === 'POST' && req.url === '/') {
        const data = await resolvePost(req);
        const projectDir = path.resolve(__dirname,`./${data.repository.name}`)
        deleteFolderRecursive(projectDir)

        // 拉取仓库最新代码
        execSync(`git clone https://github.com/bobocomeon/${data.repository.name}.git ${projectDir}`, {
            stdio: 'inherit',
        })
        // 创建 docker 镜像
        execSync(`docker build -t ${data.repository.name}-image:latest .`, {
            stdio: 'inherit',
            cwd: projectDir
        })

        // // 拉取 docker 镜像
        // execSync(`docker pull yeyan1996/docker-test-image:latest`, {
        //     stdio: 'inherit',
        //     cwd: projectDir
        // })

        // 销毁 docker 容器
        execSync(`docker ps -a -f "name=^${data.repository.name}-container" --format="{{.Names}}" | xargs -r docker stop | xargs -r docker rm`, {
            stdio: 'inherit',
        })

        // 创建 docker 容器
        execSync(`docker run -d -p 8888:80 --name ${data.repository.name}-container ${data.repository.name}-image:latest`, {
            stdio: 'inherit',
        })

        console.log('deploy success')
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    // 发送响应内容
    res.write('<h1>Hello, World!</h1>');
    res.end('ok')
}).listen(3000, () => {
    console.log('server is ready')
})