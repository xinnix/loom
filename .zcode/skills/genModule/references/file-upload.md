# File Upload Support

This guide explains how to add file upload functionality to your modules.

## Backend Setup

### 1. Create File Upload Controller

**Location:** `apps/api/src/modules/file-upload/file-upload.controller.ts`

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuid() + extname(file.originalname);
    cb(null, uniqueName);
  },
});

@Controller('file-upload')
export class FileUploadController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      size: file.size,
    };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10, { storage }))
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      size: file.size,
    }));
  }
}
```

### 2. Update Schema

Add file fields to your Prisma schema:

```prisma
model Article {
  id          String   @id @default(cuid())
  title       String
  cover       String?  // Single image
  attachments String?  // JSON array of file URLs
  // ... other fields
}
```

### 3. Update Zod Schema

```typescript
export const ArticleSchema = {
  createInput: z.object({
    title: z.string(),
    cover: z.string().optional(), // Image URL
    attachments: z.string().optional(), // JSON string
  }),
  // ... other schemas
};
```

## Frontend Setup

### Using the FileUploadComponent

The component is available at: `.claude/skills/genModule/references/templates/frontend/file-upload.component.tsx`

**Usage in Create/Edit Forms:**

```typescript
import { FileUploadComponent } from '@/shared/components/FileUploadComponent';

// For single image upload
<Form.Item
  name="cover"
  label="Cover Image"
  valuePropName="fileList"
  getValueFromEvent={(e) => e.fileList}
>
  <FileUploadComponent
    name="cover"
    accept="image/*"
    multiple={false}
  />
</Form.Item>

// For multiple file upload
<Form.Item
  name="attachments"
  label="Attachments"
  valuePropName="fileList"
  getValueFromEvent={(e) => e.fileList}
>
  <FileUploadComponent
    name="attachments"
    multiple={true}
    maxCount={10}
  />
</Form.Item>
```

## Displaying Uploaded Files

### In List Page:

```typescript
<Table.Column
  dataIndex="cover"
  title="Cover"
  render={(url) => url ? <Image src={url} width={50} /> : '-'}
/>
```

### In Detail/Show Page:

```typescript
{record.cover && (
  <Image src={record.cover} width={200} />
)}

{record.attachments && (
  <Space direction="vertical">
    {JSON.parse(record.attachments).map((file: string) => (
      <a key={file} href={file} target="_blank">
        {file.split('/').pop()}
      </a>
    ))}
  </Space>
)}
```

## Configuration Options

### FileUploadComponent Props

| Prop     | Type    | Default | Description                            |
| -------- | ------- | ------- | -------------------------------------- |
| name     | string  | 'file'  | Form field name                        |
| multiple | boolean | false   | Allow multiple files                   |
| maxCount | number  | 1       | Maximum number of files                |
| accept   | string  | -       | Accepted file types (e.g., 'image/\*') |
| value    | string  | -       | Current value                          |
| onChange | func    | -       | Callback when value changes            |
| disabled | boolean | false   | Disable upload                         |

### Common Accept Types

- Images: `accept="image/*"`
- Documents: `accept=".pdf,.doc,.docx"`
- Videos: `accept="video/*"`
- All: (no accept prop)

## Security Considerations

1. **File Size Limits:** Configure NestJS body parser limits
2. **File Type Validation:** Validate file types on backend
3. **Authentication:** Protect upload endpoints with guards
4. **Storage:** Use secure storage solutions (S3, Cloudinary) for production
