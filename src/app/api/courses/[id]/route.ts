// src/app/api/courses/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET course by ID
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error("GET_COURSE_ERROR", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

// UPDATE course by ID
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const data = await request.json();

    const updatedCourse = await prisma.course.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedCourse, { status: 200 });
  } catch (error) {
    console.error("UPDATE_COURSE_ERROR", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

// DELETE course by ID
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE_COURSE_ERROR", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
