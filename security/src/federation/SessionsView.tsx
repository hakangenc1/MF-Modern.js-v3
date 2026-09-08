import { Globe, Loader2 } from "lucide-react";
import { formatDateTime, relativeTime, type SessionEntry } from "@/mock";
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

export default function SessionsView({
  sessions,
  onRevoke,
  pendingId = null,
}: {
  sessions: SessionEntry[];
  onRevoke: (id: string) => void;
  /** id of the session currently being ended (spinner on that row only). */
  pendingId?: string | null;
}) {
  return (
    <>
      <PageHeader
        origin={{ name: "security", port: 3003 }}
        title="Active sessions"
        description="Where your account is currently signed in. End any you don't recognise."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{sessions.length} sessions</CardTitle>
          <CardDescription>Sessions expire after 8 hours of inactivity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Browser</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                        <Globe className="size-4" />
                      </div>
                      <span className="font-medium">{s.browser}</span>
                      {s.current ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Current
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.ip}</TableCell>
                  <TableCell className="text-muted-foreground">{s.location}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {relativeTime(s.startedAt)} · {formatDateTime(s.startedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.current ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === s.id}
                        onClick={() => onRevoke(s.id)}
                      >
                        {pendingId === s.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        End session
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
