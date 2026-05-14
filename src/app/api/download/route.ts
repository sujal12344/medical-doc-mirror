import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let path = searchParams.get("path");

    if (!path) {
      return new NextResponse("Path is required", { status: 400 });
    }

    // If the path is a full storage.googleapis.com URL (from previous saves), extract the GCS path
    const bucketName = process.env.GCS_BUCKET?.trim() || "";
    const publicPrefix = `https://storage.googleapis.com/${bucketName}/`;
    if (path.startsWith(publicPrefix)) {
      path = path.replace(publicPrefix, "");
    }

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey || !bucketName) {
      console.error("Missing GCS environment variables");
      return new NextResponse("Storage not configured", { status: 500 });
    }

    const storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(path);

    // Generate a signed URL for reading
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Error generating read signed URL:", error);
    return new NextResponse("Failed to generate download link", { status: 500 });
  }
}
