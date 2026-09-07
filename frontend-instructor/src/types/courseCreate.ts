export type PricingType = "free" | "one_time";

export type CourseStep1 = {
  title: string;
  subtitle: string;
  description: string;
  whatYouWillLearn: string;
  pricingType: PricingType;
  price: string;
  originalPrice: string;
  pgFeesToLearner: boolean;
};

export type LessonKind = "video" | "pdf" | "quiz" | "link" | "audio" | "text";

export type QuizQuestionType = "image" | "video" | "text" | "qa";

export type QuizOptionKind = "text" | "image" | "video";
export type QuizOption = { type: QuizOptionKind; text: string; media_url?: string };

export type QuizQ = {
  id: string;
  type: QuizQuestionType;
  question: string;
  prompt?: string;
  media_url?: string;
  options: (string | QuizOption)[];
  correct: number;
  answer?: string;
};

export type Lesson = {
  id: string;
  title: string;
  kind: LessonKind;
  duration: string;
  resource_url: string;
  quiz_data?: QuizQ[];
};

export type Chapter = {
  id: string;
  title: string;
  lessons: Lesson[];
};