import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { Todo } from '@/entities/Todo';

interface RouteParams {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const ds = await getDataSource();
    const repo = ds.getRepository(Todo);

    const todo = await repo.findOne({ where: { id } });
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    if (typeof body.title === 'string') {
      if (body.title.trim() === '') {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      todo.title = body.title.trim();
    }

    if ('description' in body) {
      todo.description = body.description ? body.description.trim() : null;
    }

    if (typeof body.completed === 'boolean') {
      todo.completed = body.completed;
    }

    const updated = await repo.save(todo);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/todos/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const ds = await getDataSource();
    const repo = ds.getRepository(Todo);

    const todo = await repo.findOne({ where: { id } });
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    await repo.remove(todo);
    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/todos/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}
