# 环境变量配置指南

所有环境变量统一在根目录 `.env` 配置，各应用共享。

## 基础配置

```bash
PORT=3000                          # API 服务端口
CORS_ORIGIN="*"                    # CORS 来源（生产环境指定域名）
NODE_ENV=development               # 运行环境
```

## JWT 认证

```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h                  # Access Token 过期时间
JWT_REFRESH_EXPIRES_IN=30d         # Refresh Token 过期时间
```

## 数据库

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## 微信小程序

```bash
WX_APP_ID=your-wechat-app-id
WX_APP_SECRET=your-wechat-app-secret
```

## 微信支付

```bash
WX_PAY_APP_ID=your-wechat-pay-app-id
WX_PAY_MCH_ID=your-merchant-id
WX_PAY_API_KEY=your-api-v3-key
WX_PAY_SERIAL_NO=your-certificate-serial-no
WX_PAY_PRIVATE_KEY_PATH=./certs/apiclient_key.pem
WX_PAY_NOTIFY_URL=https://your-domain.com/api/payments/wechat/callback
WX_PAY_SANDBOX=false
```

## 文件上传

### OSS（推荐）

```bash
FILE_STORAGE_PROVIDER=aliyun-oss
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET=your-bucket-name
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_REGION=oss-cn-hangzhou
```

### 本地存储（开发用）

```bash
FILE_STORAGE_PROVIDER=local
UPLOAD_PATH=./uploads
SERVER_URL=http://localhost:3000
```

## 生产环境检查清单

| 变量                | 要求                                        |
| ------------------- | ------------------------------------------- |
| `JWT_SECRET`        | ≥32 字符强密钥                              |
| `CORS_ORIGIN`       | 指定具体域名，不用 `*`                      |
| `WX_PAY_NOTIFY_URL` | HTTPS 域名                                  |
| `WX_PAY_SANDBOX`    | 设为 `false`                                |
| 证书文件            | 放在 `apps/api/certs/`，已加入 `.gitignore` |

完整配置模板见根目录 `.env.example`。
