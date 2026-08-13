import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";
import { FRAMEWORKS } from "@/lib/frameworks";

const LOG = "[generate]";

/**
 * Universal document generation endpoint
 * Routes to appropriate generator based on frameworkId
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({
      _id: id,
      userId: (user as Record<string, unknown>)._id,
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    console.log(`${LOG} Routing to appropriate generator`, {
      documentId: id,
      frameworkId: doc.frameworkId,
      framework: fw.documentType,
    });

    // Route to appropriate generator based on framework
    let targetEndpoint = "";
    
    if (doc.frameworkId === "IN_MD_1") {
      targetEndpoint = `/api/documents/${id}/generate-md1`;
    } else if (doc.frameworkId === "IN_PMF") {
      targetEndpoint = `/api/documents/${id}/generate-pmf`;
    } else {
      // Default to DMF
      targetEndpoint = `/api/documents/${id}/generate-dmf`;
    }

    console.log(`${LOG} Forwarding to ${targetEndpoint}`);

    // Forward the request to the appropriate endpoint
    const baseUrl = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const fullUrl = `${protocol}://${baseUrl}${targetEndpoint}`;

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({}),
    });

    // Forward the response
    if (response.ok) {
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/zip") || contentType?.includes("application/vnd")) {
        // Binary response (ZIP or DOCX)
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        
        return new NextResponse(buffer as unknown as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": response.headers.get("content-disposition") || "attachment",
          },
        });
      } else {
        // JSON response
        const data = await response.json();
        return NextResponse.json(data);
      }
    } else {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`${LOG} failed:`, error);
    return NextResponse.json(
      { error: "Generation failed: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    );
  }
}
