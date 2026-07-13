# 微信支付证书目录

此目录用于存放微信支付 API v3 所需的证书文件。

## 所需文件

1. **商户 API 私钥** (`apiclient_key.pem`)
   - 从微信支付商户平台下载
   - 路径：商户平台 → API安全 → API证书 → 申请API证书
   - 用途：用于签名支付请求

2. **微信支付公钥** (`wechatpay_public_key.pem`)
   - 从微信支付商户平台下载（2024年Q3新增）
   - 路径：商户平台 → 账户中心 → API安全 → 微信支付公钥
   - 用途：用于验签回调通知

## 证书获取步骤

### 1. 申请商户 API 证书

1. 登录 [微信支付商户平台](https://pay.weixin.qq.com)
2. 进入 **API安全** → **API证书** → **申请API证书**
3. 下载证书压缩包，解压后找到 `apiclient_key.pem`
4. 将文件重命名并放入此目录

### 2. 获取微信支付公钥

1. 在商户平台，进入 **账户中心** → **API安全** → **微信支付公钥**
2. 点击「下载微信支付公钥」
3. 记录公钥 ID（格式：`PUB_KEY_ID_XXXXX`）
4. 将下载的文件重命名为 `wechatpay_public_key.pem` 并放入此目录

## 配置环境变量

在 `.env.prod` 中配置：

```bash
# 商户证书序列号
WX_PAY_SERIAL_NO=你的证书序列号

# 证书路径（容器内路径）
WX_PAY_PRIVATE_KEY_PATH=/app/certs/apiclient_key.pem
WX_PAY_PUBLIC_KEY_PATH=/app/certs/wechatpay_public_key.pem

# 微信支付公钥 ID
WX_PAY_PUBLIC_KEY_ID=PUB_KEY_ID_XXXXX
```

## Docker 部署时挂载

`docker-compose.prod.yml` 已配置自动挂载：

```yaml
volumes:
  - ./certs:/app/certs:ro
```

启动容器后，证书会自动映射到容器内的 `/app/certs` 目录。

## 安全注意事项

⚠️ **重要安全提醒**：

1. **不要提交证书到 Git**
   - `.gitignore` 已配置忽略 `*.pem` 文件
   - 证书仅存储在服务器本地

2. **限制文件权限**

   ```bash
   chmod 600 certs/*.pem
   ```

3. **定期轮换证书**
   - 微信支付证书有效期 1-2 年
   - 到期前及时更新

4. **监控证书使用**
   - 定期检查支付日志
   - 异常情况立即处理

## 相关文档

- [微信支付快速配置指南](../docs/wechat-pay-quick-setup.md)
- [微信支付公钥升级指南](../docs/wechat-pay-public-key-guide.md)
- [生产环境部署指南](../docs/deployment-guide.md)

## 故障排查

### 证书文件找不到

```bash
# 检查本地证书
ls -la certs/

# 检查容器内挂载
docker exec ${PROJECT_NAME:-loom}-api-prod ls -la /app/certs
```

### 微信支付初始化失败

检查日志：

```bash
docker logs ${PROJECT_NAME:-loom}-api-prod | grep "微信支付"
```

常见原因：

- 证书文件未上传到服务器
- 环境变量路径配置错误
- 证书文件权限不足

---

**如有疑问，请参考 [生产环境部署指南](../docs/deployment-guide.md)**
