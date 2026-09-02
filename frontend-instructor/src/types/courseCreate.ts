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

export type QuizQ = { id: string; question: string; options: string[]; correct: number };

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