import { redirect } from 'next/navigation';

export default function CourseManagementRootPage({ params }: { params: { courseId: string } }) {
    redirect(`/manage-courses/${params.courseId}/edit`);
}
