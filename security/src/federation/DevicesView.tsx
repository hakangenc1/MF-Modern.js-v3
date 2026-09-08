import { Laptop, Loader2, Monitor, Smartphone, Tablet } from "lucide-react";
import { formatDate, relativeTime, type Device } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/patterns/kit";

const ICON = { phone: Smartphone, laptop: Laptop, tablet: Tablet, desktop: Monitor } as const;

export default function DevicesView({
  devices,
  onRevoke,
  pendingId = null,
}: {
  devices: Device[];
  onRevoke: (id: string) => void;
  /** id of the device currently being revoked (spinner on that row only). */
  pendingId?: string | null;
}) {
  return (
    <>
      <PageHeader
        origin={{ name: "security", port: 3003 }}
        title="Trusted devices"
        description="Devices that have signed in to your account. Remove any you don't recognise."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{devices.length} devices</CardTitle>
          <CardDescription>Trusted devices skip 2FA for 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((d) => {
                const Icon = ICON[d.kind];
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.os}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.location}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {relativeTime(d.lastActive)} · {formatDate(d.lastActive, "short")}
                    </TableCell>
                    <TableCell>
                      {d.current ? (
                        <Badge variant="secondary">This device</Badge>
                      ) : d.trusted ? (
                        <Badge variant="outline">Trusted</Badge>
                      ) : (
                        <Badge variant="destructive">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.current ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pendingId === d.id}
                          onClick={() => onRevoke(d.id)}
                        >
                          {pendingId === d.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
