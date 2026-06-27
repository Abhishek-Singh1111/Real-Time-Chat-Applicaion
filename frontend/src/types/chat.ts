export type ChatMessage = {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  image_url?: string;
  createdAt?: string;
};