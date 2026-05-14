import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileType } = await req.json();
    if (!fileName || !fileType) {
      return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 });
    }

    const companyId = (user as Record<string, unknown>)._id;

    // Use environment variables for GCP auth
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    // Replace literal '\n' characters if they exist from the .env parsing
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const bucketName = process.env.GCS_BUCKET?.trim();

    if (!projectId || !clientEmail || !privateKey || !bucketName) {
      console.error("Missing GCS environment variables");
      return NextResponse.json({ error: "Storage not configured properly on server" }, { status: 500 });
    }

    const storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    // Create a unique path for the file: companyId/timestamp_filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const gcsPath = `company-docs/${companyId}/${timestamp}_${sanitizedFileName}`;

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(gcsPath);

    // Generate a signed URL that allows the client to PUT the file directly
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: fileType,
    });

    // The public URL to access the file after upload (assuming bucket is public readable, or using authenticated access)
    // If the bucket is not public, you will need a separate signed URL to read it.
    // For now, we will store the storage URI (gs://...) or the public HTTPS URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;

    return NextResponse.json({ signedUrl, publicUrl, gcsPath });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
