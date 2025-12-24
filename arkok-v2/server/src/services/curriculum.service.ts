export interface CurriculumItem {
    version: string;
    subject: string;
    grade: string;
    semester: string;
    unit: string;
    lesson: string;
    title: string;
    // 🆕 专业教学设计维度
    pedagogy?: {
        highlights: string[]; // 教学重点
        difficulties: string[]; // 教学难点
        methodology: {
            name: string; // 核心教学法名称
            description: string; // 教学法意义/培养目标
        }
    };
}

/**
 * 📚 标准课程库数据索引 (2025 新版人教版)
 * 集成了专业教学设计，支持家长端价值展现
 */
const CURRICULUM_DATA: CurriculumItem[] = [
    // --- 2025 新版 人教版 语文 一年级 上册 ---
    {
        version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '1', title: '天地人',
        pedagogy: {
            highlights: ['认识“天、地、人”等6个生字', '理解人与自然的关系'],
            difficulties: ['区分“地”与“他”的字形', '初步建立识字兴趣'],
            methodology: {
                name: '情境识字法',
                description: '通过联想自然图景，让孩子在无压力环境下快速建立汉字与实物的联系，培养初步的观察力。'
            }
        }
    },
    {
        version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '2', title: '金木水火土',
        pedagogy: {
            highlights: ['认识五行对应的生字', '背诵课文内容'],
            difficulties: ['理解五行元素的朴素概念', '字音的准确性'],
            methodology: {
                name: '韵文朗读训练',
                description: '利用汉语韵律感，训练孩子的节奏捕捉能力和快速记忆力，为后续语感打下基础。'
            }
        }
    },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '3', title: '口耳目' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '4', title: '日月水火' },
    { version: '人教版', subject: 'chinese', grade: '1', semester: '上', unit: '1', lesson: '5', title: '对韵歌' },

    // --- 2025 新版 人教版 语文 二年级 上册 ---
    {
        version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '1', lesson: '1', title: '小蝌蚪找妈妈',
        pedagogy: {
            highlights: ['分角色朗读课文', '理解科学常识'],
            difficulties: ['动词“迎、追、游”的区别', '按顺序描述变化'],
            methodology: {
                name: '交互式阅读',
                description: '通过角色扮演，锻炼孩子的同理心和口语表达的逻辑连贯性。'
            }
        }
    },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '1', lesson: '2', title: '我是什么' },
    { version: '人教版', subject: 'chinese', grade: '2', semester: '上', unit: '1', lesson: '3', title: '植物妈妈有办法' },

    // ... (更多数据可在此处扩充)
];

export class CurriculumService {
    /**
     * 智能匹配课文数据 (含教学设计)
     */
    static getLessonData(params: {
        subject: string;
        unit: string | number;
        lesson?: string | number;
        version?: string;
        grade?: string;
    }): CurriculumItem | null {
        const { subject, unit, lesson = '1', version = '人教版', grade = '2' } = params;

        return CURRICULUM_DATA.find(item =>
            item.subject === subject &&
            String(item.unit) === String(unit) &&
            (String(item.lesson) === String(lesson) || !item.lesson) &&
            item.version === version
        ) || null;
    }

    /**
     * 获取完整学期大纲图谱
     */
    static getSyllabus(params: {
        subject: string;
        version?: string;
        grade?: string;
        semester?: string;
    }): CurriculumItem[] {
        const { subject, version = '人教版', grade = '2', semester = '上' } = params;

        return CURRICULUM_DATA.filter(item =>
            item.subject === subject &&
            item.version === version &&
            item.grade === grade &&
            item.semester === semester
        ).sort((a, b) => {
            const unitA = parseInt(a.unit);
            const unitB = parseInt(b.unit);
            if (unitA !== unitB) return unitA - unitB;
            return parseInt(a.lesson) - parseInt(b.lesson);
        });
    }

    /**
     * 保持兼容性的老接口
     */
    static getTitle(params: any): string | null {
        const data = this.getLessonData(params);
        return data ? data.title : null;
    }
}

export default CurriculumService;
