import Sidebar from "@/app/_components/feed/sidebar";
import TopBar from "@/app/_components/feed/top-bar";
import NinosManager from "@/app/_components/ninos/ninos-manager";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { DbRoom } from "@/app/_lib/db-types";
import { mapDbChildToChild } from "@/app/_lib/child-helpers";

export default async function NinosPage() {
  const supabase = await createClient(await cookies());

  const [roomsResult, childrenResult] = await Promise.all([
    supabase.from("rooms").select("*").order("created_at"),
    supabase
      .from("children")
      .select("*")
      .eq("status", "active")
      .order("full_name"),
  ]);

  if (roomsResult.error) throw roomsResult.error;
  if (childrenResult.error) throw childrenResult.error;

  const rooms = roomsResult.data as DbRoom[];
  const roomNames = new Map(rooms.map((r) => [r.id, r.name]));

  const children = childrenResult.data.map((row, index) =>
    mapDbChildToChild(row, roomNames.get(row.room_id) ?? "", index)
  );

  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden md:block">
        <Sidebar activeItem="ninos" />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 min-w-0 h-screen overflow-y-auto">
          <div className="max-w-[880px] w-full mx-auto px-10 py-[34px] pb-20 max-md:px-4">
            <NinosManager initialChildren={children} rooms={rooms} />
          </div>
        </main>
      </div>
    </div>
  );
}
