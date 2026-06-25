import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoNotice, LoginNotice } from "@/components/access-notices";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import { deleteCampaign, getCampaign } from "@/lib/campaigns/actions";
import { STATUS_LABELS } from "@/lib/campaigns/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <DemoNotice />;
  const user = await getUser();
  if (!user) return <LoginNotice />;

  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const tpl = campaign.systemSnapshot;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {campaign.name}
            </h1>
            <span className="rounded bg-muted px-2 py-0.5 text-xs">
              {STATUS_LABELS[campaign.status]}
            </span>
          </div>
          <p className="text-muted-foreground">
            {[campaign.genre, campaign.tone, campaign.setting]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/campaigns/${campaign.id}/edit`}>
            <Button variant="outline">Editar</Button>
          </Link>
          <form action={deleteCampaign.bind(null, campaign.id)}>
            <Button variant="ghost" type="submit">
              Excluir
            </Button>
          </form>
        </div>
      </div>

      {campaign.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">
            {campaign.description}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sistema: {tpl.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="mb-1 font-medium">Atributos</div>
            <div className="flex flex-wrap gap-2">
              {tpl.attributes.map((a) => (
                <span
                  key={a.key}
                  className="rounded bg-muted px-2 py-0.5 text-xs"
                >
                  {a.label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 font-medium">Recursos</div>
            <div className="flex flex-wrap gap-2">
              {tpl.resources.map((r) => (
                <span
                  key={r.key}
                  className="rounded bg-muted px-2 py-0.5 text-xs"
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>
          <p className="text-muted-foreground">
            Rolagem base: <code>{tpl.rolls.default.formula}</code> ({tpl.kind})
          </p>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Personagens, NPCs, locais e sessões desta campanha chegam nos próximos
        marcos (M2–M3).
      </p>
    </div>
  );
}
