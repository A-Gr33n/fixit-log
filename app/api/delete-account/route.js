import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.slice(7);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase server configuration.");

      return NextResponse.json(
        { error: "Account deletion is not configured." },
        { status: 500 }
      );
    }

    // This client is used only on the server.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the access token with Supabase.
    // Never trust a user ID supplied by the browser.
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your session has expired. Please sign in again." },
        { status: 401 }
      );
    }

    // Require an explicit confirmation before deleting anything.
    const body = await request.json().catch(() => null);

    if (body?.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Account deletion was not confirmed." },
        { status: 400 }
      );
    }

    const userId = user.id;
    const bucket = "home-documents";

    // Find every storage file belonging to this user,
    // including files that no longer have a database record.
    const filesToDelete = [];

    async function collectFiles(folder) {
      let offset = 0;
      const pageSize = 100;

      while (true) {
        const { data, error } = await admin.storage
          .from(bucket)
          .list(folder, {
            limit: pageSize,
            offset,
          });

        if (error) {
          throw new Error(`Could not list uploaded files: ${error.message}`);
        }

        const entries = data || [];

        for (const entry of entries) {
          const path = `${folder}/${entry.name}`;

          if (entry.id) {
            filesToDelete.push(path);
          } else {
            await collectFiles(path);
          }
        }

        if (entries.length < pageSize) {
          break;
        }

        offset += pageSize;
      }
    }

    await collectFiles(userId);

    // Remove actual uploaded files before removing their database records.
    for (let i = 0; i < filesToDelete.length; i += 100) {
      const batch = filesToDelete.slice(i, i + 100);

      const { error } = await admin.storage
        .from(bucket)
        .remove(batch);

      if (error) {
        throw new Error(`Could not delete uploaded files: ${error.message}`);
      }
    }

      // Delete maintenance records.
    const { error: maintenanceError } = await admin
      .from("maintenance")
      .delete()
      .eq("user_id", userId);

    if (maintenanceError) {
      throw new Error(
        `Could not delete maintenance records: ${maintenanceError.message}`
      );
    }

    // Delete repair records.
    const { error: repairsError } = await admin
      .from("repairs")
      .delete()
      .eq("user_id", userId);

    if (repairsError) {
      throw new Error(
        `Could not delete repair records: ${repairsError.message}`
      );
    }

    // Delete the authentication account.
    // Other linked database records are deleted automatically.
    const { error: deleteUserError } =
      await admin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      throw new Error(
        `Could not delete account: ${deleteUserError.message}`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your account and associated data have been deleted.",
    });
  } catch (error) {
    console.error("Account deletion failed:", error);

    return NextResponse.json(
      {
        error:
          "We couldn't finish deleting your account. Please try again or contact privacy@fixit-log.co.uk.",
      },
            { status: 500 }
    );
  }
}