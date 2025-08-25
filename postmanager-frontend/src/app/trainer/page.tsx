import type { Metadata } from "next";
import Trainer from "./Trainer";

export const metadata: Metadata = {
  title: "Тренажер",
  description: "Тренажер по командам AstraLinux"
};

export default function TrainerPage() {
  return <Trainer />;
}
