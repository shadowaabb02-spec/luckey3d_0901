/*
 * 运行时地址只指向本机网关；密钥仅保存在 server/.env，绝不写入浏览器。
 * 部署到服务器时，只需将这里改为同源地址或服务器上的 HTTPS 网关地址。
 */
window.EXPERT_GATEWAY_URL = window.EXPERT_GATEWAY_URL || 'http://127.0.0.1:8787';
