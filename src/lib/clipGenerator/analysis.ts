import type { TranscriptSegment, DetectedMoment } from './types';

const HOOK_PATTERNS = [
  /\b(i tried|i tested|i did|i made|i built|i started|i quit|i stopped|i spent|i bought|i found|i discovered|i learned|i realised|i realized)\b/i,
  /\b(here'?s what|this is why|the truth about|nobody tells you|what they don'?t|the secret to)\b/i,
  /\b(you need to|you should never|stop doing this|do this instead)\b/i,
  /\b(\$\d|\d+%|\d+k\b|\d+ million|\d+ hours|\d+ days)\b/i,
];

const QUESTION_PATTERN = /\?\s*$/;

const EMOTION_WORDS = [
  'amazing', 'incredible', 'insane', 'crazy', 'unbelievable', 'shocking', 'mind-blowing',
  'devastating', 'life-changing', 'never', 'ever', 'swear', 'promise', 'honestly',
  'literally', 'actually', 'serious', 'scared', 'afraid', 'worried', 'excited',
  'passionate', 'furious', 'heartbreaking', 'tears', 'cry', 'laugh', 'love', 'hate',
];

const LAUGHTER_WORDS = ['lol', 'lmao', 'haha', 'hahaha', 'laughs', 'laughter', '[laughs]', '[laughing]', 'funny', 'hilarious'];

const MONEY_WORDS = [
  'money', 'cash', 'dollar', 'revenue', 'profit', 'income', 'salary', 'rich',
  'wealth', 'invest', 'stock', 'crypto', 'bitcoin', 'million', 'billion', 'thousand',
  'cost', 'price', 'paid', 'earn', 'made', 'lost', 'bought', 'sold', 'budget',
  'expensive', 'cheap', 'free', 'discount', 'sale', 'deal', '$',
];

const BUSINESS_WORDS = [
  'business', 'company', 'startup', 'entrepreneur', 'founder', 'ceo', 'ceo',
  'marketing', 'sales', 'customer', 'client', 'product', 'service', 'brand',
  'strategy', 'growth', 'scale', 'team', 'hire', 'employee', 'market', 'niche',
  'competitor', 'acquisition', 'funding', 'investor', 'pitch', 'launch',
];

const LIFESTYLE_WORDS = [
  'morning', 'routine', 'habit', 'gym', 'workout', 'diet', 'food', 'travel',
  'car', 'house', 'apartment', 'move', 'city', 'country', 'lifestyle', 'life',
  'family', 'friend', 'relationship', 'date', 'wedding', 'vacation', 'holiday',
];

const PRODUCTIVITY_WORDS = [
  'productivity', 'efficient', 'focus', 'deep work', 'system', 'workflow',
  'process', 'organize', 'plan', 'schedule', 'task', 'todo', 'deadline',
  'time management', 'goal', 'achieve', 'discipline', 'consistent', 'habit',
  'morning routine', 'evening routine', 'schedule', 'calendar',
];

const MOTIVATION_WORDS = [
  'motivat', 'inspir', 'dream', 'goal', 'achieve', 'success', 'fail', 'failure',
  'never give up', 'keep going', 'push', 'grind', 'hustle', 'work hard',
  'believe', 'confidence', 'overcome', 'struggle', 'fight', 'win', 'champion',
  'mindset', 'discipline', 'dedication', 'commitment', 'passion', 'purpose',
];

const STORY_CHANGE_PATTERNS = [
  /\b(so then|after that|the next day|a few days later|weeks later|months later|years later|fast forward|moving on|anyway|now|but then|that'?s when)\b/i,
  /\b(part \d|chapter \d|step \d|day \d|phase \d)\b/i,
];

interface MomentWindow {
  start: number;
  end: number;
  text: string;
  tags: Set<string>;
  scores: number[];
}

export function analyzeTranscript(segments: TranscriptSegment[]): DetectedMoment[] {
  const moments: DetectedMoment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const text = seg.text.trim();
    if (!text) continue;

    const tags = new Set<string>();
    let score = 0;

    for (const pattern of HOOK_PATTERNS) {
      if (pattern.test(text)) {
        tags.add('Strong Hook');
        score += 25;
        break;
      }
    }

    if (QUESTION_PATTERN.test(text)) {
      tags.add('Question');
      score += 15;
    }

    const lowerText = text.toLowerCase();

    const emotionMatches = EMOTION_WORDS.filter(w => lowerText.includes(w));
    if (emotionMatches.length >= 2) {
      tags.add('High Emotion');
      score += 20;
    } else if (emotionMatches.length === 1) {
      tags.add('High Emotion');
      score += 10;
    }

    const laughterMatches = LAUGHTER_WORDS.filter(w => lowerText.includes(w));
    if (laughterMatches.length > 0) {
      tags.add('Laughter');
      score += 18;
    }

    if (MONEY_WORDS.some(w => lowerText.includes(w))) {
      tags.add('Money Discussion');
      score += 22;
    }

    if (BUSINESS_WORDS.some(w => lowerText.includes(w))) {
      tags.add('Business Discussion');
      score += 20;
    }

    if (LIFESTYLE_WORDS.some(w => lowerText.includes(w))) {
      tags.add('Lifestyle Moment');
      score += 12;
    }

    if (PRODUCTIVITY_WORDS.some(w => lowerText.includes(w))) {
      tags.add('Productivity Moment');
      score += 15;
    }

    if (MOTIVATION_WORDS.some(w => lowerText.includes(w))) {
      tags.add('Motivational Moment');
      score += 18;
    }

    for (const pattern of STORY_CHANGE_PATTERNS) {
      if (pattern.test(text)) {
        tags.add('Story Change');
        score += 10;
        break;
      }
    }

    if (text.split(/\s+/).length > 15) {
      score += 3;
    }

    if (tags.size > 0) {
      moments.push({
        start: seg.start,
        end: seg.end,
        text,
        tags: Array.from(tags),
        score: Math.min(score, 100),
      });
    }
  }

  return moments;
}

export function detectClips(
  moments: DetectedMoment[],
  segments: TranscriptSegment[],
  targetCount: number = 35
): DetectedMoment[] {
  if (moments.length === 0) return [];

  const CLIP_MIN = 15;
  const CLIP_MAX = 90;
  const OVERLAP_THRESHOLD = 5;

  type ScoredMoment = DetectedMoment & { clipStart: number; clipEnd: number; clipScore: number };

  const candidates: ScoredMoment[] = moments.map(m => {
    let clipStart = Math.max(0, m.start - 2);
    let clipEnd = m.end;

    let j = segments.findIndex(s => s.start >= m.start);
    while (j < segments.length && clipEnd - clipStart < CLIP_MIN) {
      clipEnd = segments[j].end;
      j++;
    }

    if (clipEnd - clipStart > CLIP_MAX) {
      clipEnd = clipStart + CLIP_MAX;
    }

    const nearbyMoments = moments.filter(
      other => other.start >= clipStart && other.end <= clipEnd && other !== m
    );
    const combinedScore = m.score + nearbyMoments.reduce((s, m2) => s + m2.score * 0.3, 0);

    return { ...m, clipStart, clipEnd, clipScore: combinedScore };
  });

  candidates.sort((a, b) => b.clipScore - a.clipScore);

  const selected: ScoredMoment[] = [];
  for (const c of candidates) {
    const overlaps = selected.some(s =>
      c.clipStart < s.clipEnd - OVERLAP_THRESHOLD && c.clipEnd > s.clipStart + OVERLAP_THRESHOLD
    );
    if (!overlaps) {
      selected.push(c);
    }
    if (selected.length >= targetCount) break;
  }

  selected.sort((a, b) => a.clipStart - b.clipStart);

  return selected.map(s => ({
    start: s.clipStart,
    end: s.clipEnd,
    text: s.text,
    tags: s.tags,
    score: Math.min(s.clipScore, 100),
  }));
}

export function generateClipTitle(moment: DetectedMoment, index: number): string {
  const text = moment.text.replace(/[^\w\s$%]/g, '').trim();
  const words = text.split(/\s+/).slice(0, 6).join(' ');
  const prefix = moment.tags[0] ? `[${moment.tags[0]}] ` : '';
  return `${prefix}${words}${words.length < text.length ? '...' : ''}`.slice(0, 60) || `Clip ${index + 1}`;
}

export function generateClipReason(tags: string[], score: number): string {
  const tagText = tags.length > 0 ? tags.join(', ') : 'Interesting moment';
  const confidenceText = score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low';
  return `${tagText} — ${confidenceText} viral potential`;
}
