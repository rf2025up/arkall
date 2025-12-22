import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface ProcessedImageData {
  original: Buffer;
  processed: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export class OCRService {
  private readonly supportedLanguages = ['chi_sim', 'eng'];
  private readonly tempDir = './temp';

  constructor() {
    this.ensureTempDirectory();
  }

  /**
   * 确保临时目录存在
   */
  private ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 预处理图像以提高OCR准确性
   */
  async preprocessImage(imageBuffer: Buffer): Promise<ProcessedImageData> {
    try {
      // 获取图像元数据
      const metadata = await sharp(imageBuffer).metadata();

      // 图像预处理
      const processedBuffer = await sharp(imageBuffer)
        .resize({
          width: metadata.width ? Math.min(metadata.width * 2, 2000) : 1000,
          height: metadata.height ? Math.min(metadata.height * 2, 2000) : 1000,
          fit: 'inside'
        })
        .sharpen({
          sigma: 1,
          flat: 1,
          jagged: 2
        })
        .normalize()
        .threshold(128)
        .png()
        .toBuffer();

      return {
        original: imageBuffer,
        processed: processedBuffer,
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown',
          size: imageBuffer.length
        }
      };
    } catch (error) {
      console.error('图像预处理失败:', error);
      throw new Error('图像预处理失败');
    }
  }

  /**
   * 执行OCR识别
   */
  async recognizeText(imageBuffer: Buffer, options: {
    languages?: string[];
    enhance?: boolean;
  } = {}): Promise<OCRResult> {
    try {
      const {
        languages = this.supportedLanguages,
        enhance = true
      } = options;

      let processBuffer = imageBuffer;

      // 图像预处理
      if (enhance) {
        const processed = await this.preprocessImage(imageBuffer);
        processBuffer = processed.processed;
      }

      // 执行OCR识别
      const result = await Tesseract.recognize(
        processBuffer,
        languages.join('+'),
        {
          logger: (info) => {
            if (info.status === 'recognizing text') {
              console.log(`OCR进度: ${Math.round(info.progress * 100)}%`);
            }
          }
        }
      );

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })),
        lines: result.data.lines.map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox
        }))
      };
    } catch (error) {
      console.error('OCR识别失败:', error);
      throw new Error('OCR识别失败');
    }
  }

  /**
   * 批量处理图像OCR
   */
  async batchRecognize(
    imageBuffers: Buffer[],
    options: {
      languages?: string[];
      enhance?: boolean;
      concurrent?: number;
    } = {}
  ): Promise<OCRResult[]> {
    const {
      concurrent = 3
    } = options;

    const results: OCRResult[] = [];

    // 分批处理
    for (let i = 0; i < imageBuffers.length; i += concurrent) {
      const batch = imageBuffers.slice(i, i + concurrent);
      const batchPromises = batch.map(buffer =>
        this.recognizeText(buffer, options)
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`批量处理第 ${i} 批失败:`, error);
        // 添加空结果以保持数组长度一致
        for (let j = 0; j < batch.length; j++) {
          results.push({
            text: '',
            confidence: 0,
            words: [],
            lines: []
          });
        }
      }
    }

    return results;
  }

  /**
   * 清理临时文件
   */
  async cleanup(): Promise<void> {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.tempDir, file));
        }
      }
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }

  /**
   * 验证图像格式
   */
  validateImage(buffer: Buffer): boolean {
    try {
      // 检查是否为有效图像
      return buffer.length > 0 &&
             (buffer.toString('hex', 0, 4).startsWith('ffd8') || // JPEG
              buffer.toString('hex', 0, 8).startsWith('89504e47') || // PNG
              buffer.toString('hex', 0, 4).startsWith('52494646')); // WebP/RIFF
    } catch {
      return false;
    }
  }

  /**
   * 获取支持的图像格式
   */
  getSupportedFormats(): string[] {
    return ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff'];
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): string[] {
    return [
      { code: 'chi_sim', name: '简体中文' },
      { code: 'chi_tra', name: '繁体中文' },
      { code: 'eng', name: '英语' },
      { code: 'jpn', name: '日语' },
      { code: 'kor', name: '韩语' }
    ].map(lang => typeof lang === 'string' ? lang : lang.code);
  }
}