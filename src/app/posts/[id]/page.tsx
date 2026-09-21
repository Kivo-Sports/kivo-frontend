"use client";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/templates/AppLayout";
import { Feed } from "@/components/organisms/Feed/Feed";
export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AppLayout>
      <Feed postId={id} />
    </AppLayout>
  );
}
