import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const imageExtensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

function isGoogleImageHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === 'googleusercontent.com' || host.endsWith('.googleusercontent.com');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 });

  const supabase = await createClient();
  const { data: idea } = await supabase
    .from('ideas')
    .select('id, trip_id, image_url, cover_url')
    .eq('id', id)
    .maybeSingle();

  if (!idea) return new NextResponse(null, { status: 404 });

  if (idea.cover_url) {
    const { data } = await supabase.storage.from('idea-images').createSignedUrl(idea.cover_url, 3600);
    return data?.signedUrl
      ? NextResponse.redirect(data.signedUrl)
      : new NextResponse(null, { status: 404 });
  }

  if (!idea.image_url) return new NextResponse(null, { status: 404 });

  let source: URL;
  try {
    source = new URL(idea.image_url);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (source.protocol !== 'https:' || !isGoogleImageHost(source.hostname)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const response = await fetch(source, {
      cache: 'no-store',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; TripHub/1.0)',
      },
    });
    if (!response.ok) return new NextResponse(null, { status: 502 });

    const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase() ?? '';
    const extension = imageExtensions.get(contentType);
    if (!extension) return new NextResponse(null, { status: 415 });

    const declaredSize = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) {
      return new NextResponse(null, { status: 413 });
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > MAX_IMAGE_BYTES) return new NextResponse(null, { status: 413 });

    const path = `${idea.trip_id}/${idea.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('idea-images')
      .upload(path, bytes, { contentType, upsert: false });
    if (uploadError) return new NextResponse(null, { status: 500 });

    const { error: updateError } = await supabase
      .from('ideas')
      .update({ cover_url: path, image_url: null })
      .eq('id', idea.id)
      .eq('trip_id', idea.trip_id);
    if (updateError) {
      await supabase.storage.from('idea-images').remove([path]);
      return new NextResponse(null, { status: 500 });
    }

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
