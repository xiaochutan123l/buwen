/**
 * 数据持久化 API
 * 将数据存储在服务器端的 JSON 文件中，支持多设备同步
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 数据文件路径 - 存储在项目根目录的 data 文件夹
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'buwen-data.json');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// GET - 读取数据
export async function GET() {
  try {
    await ensureDataDir();
    
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    } catch {
      // 文件不存在，返回空数据结构
      return NextResponse.json({
        state: {
          projects: [],
          scheduledTasks: [],
          tags: [
            { id: '1', name: '工作', color: '#FF6B6B' },
            { id: '2', name: '学习', color: '#4ECDC4' },
            { id: '3', name: '生活', color: '#45B7D1' },
          ],
          settings: {
            theme: 'light',
            language: 'zh',
            customColors: ['#4ECDC4'],
          },
        },
        version: 1,
      });
    }
  } catch (error) {
    console.error('读取数据失败:', error);
    return NextResponse.json({ error: '读取数据失败' }, { status: 500 });
  }
}

// POST - 保存数据
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    
    const data = await request.json();
    
    // 添加时间戳
    const dataWithTimestamp = {
      ...data,
      lastModified: new Date().toISOString(),
    };
    
    await fs.writeFile(DATA_FILE, JSON.stringify(dataWithTimestamp, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, lastModified: dataWithTimestamp.lastModified });
  } catch (error) {
    console.error('保存数据失败:', error);
    return NextResponse.json({ error: '保存数据失败' }, { status: 500 });
  }
}
