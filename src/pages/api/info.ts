import type { APIRoute } from 'astro';
import { getAllInfo } from '@/lib/systemInfo';

export const GET: APIRoute = async ({ request }) => {
  try {
    const info = await getAllInfo(request);
    return new Response(JSON.stringify(info), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
