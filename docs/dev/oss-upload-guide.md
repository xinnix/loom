# OSS 直传上传

基于阿里云 OSS Post Object Policy 实现前端直传，文件不经过后端服务器。

## 架构

```
前端 → 请求签名 Policy → 后端(tRPC) → 返回签名 + OSS 地址
前端 → 直传文件到 OSS（带签名 Policy）
前端 → 调用后端保存文件记录
```

## 环境变量

```bash
FILE_STORAGE_PROVIDER=aliyun-oss
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET=your-bucket-name
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_REGION=oss-cn-hangzhou
```

## 后端 tRPC 端点

| 端点                     | 说明                                         |
| ------------------------ | -------------------------------------------- |
| `upload.getUploadPolicy` | 获取 OSS 签名 Policy（含过期时间、大小限制） |
| `upload.completeUpload`  | 上传完成后保存文件记录到数据库               |
| `upload.listFiles`       | 查询已上传文件列表                           |
| `upload.deleteFile`      | 删除文件记录及 OSS 对象                      |

## 前端上传组件

```tsx
import { Upload } from 'antd';

<Upload
  action={uploadPolicy.host}
  data={uploadPolicy.params}
  beforeUpload={checkFileSize}
  onSuccess={handleUploadComplete}
/>;
```

## 限制

| 项目           | 默认值                     |
| -------------- | -------------------------- |
| 单文件大小     | 10 MB                      |
| 文件路径前缀   | `uploads/{yyyy}/{mm}/`     |
| Policy 有效期  | 15 分钟                    |
| 允许的文件类型 | 由前端 `beforeUpload` 控制 |

## OSS Bucket 配置

1. 读写权限：**公共读、私有写**
2. CORS 规则：

| 配置项       | 值                            |
| ------------ | ----------------------------- |
| 来源         | `*`（开发）或指定域名（生产） |
| 允许 Methods | `GET, POST, PUT`              |
| 允许 Headers | `*`                           |
| 暴露 Headers | `ETag, x-oss-request-id`      |

## 本地存储备选

设置 `FILE_STORAGE_PROVIDER=local`，文件保存到 `UPLOAD_PATH`（默认 `./uploads`），通过 `SERVER_URL` 构建访问 URL。仅适合开发环境。
