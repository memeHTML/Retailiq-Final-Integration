import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

function Line({ width = '100%' }: { width?: string | number }) {
  return <SkeletonLoader variant="text" width={width} height="1rem" />;
}

function Block({ height, className = '' }: { height: number | string; className?: string }) {
  return <SkeletonLoader variant="rect" width="100%" height={height} className={className} />;
}

function PillRow({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonLoader key={index} variant="rect" width={index % 2 === 0 ? 92 : 120} height={32} className="rounded-full" />
      ))}
    </div>
  );
}

export function InventoryProductsSkeleton({ view = 'grid' }: { view?: 'grid' | 'table' }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonLoader variant="rect" width={180} height={44} className="rounded-lg" />
            <SkeletonLoader variant="rect" width={64} height={28} className="rounded-full" />
          </div>
          <Line width={320} />
        </div>
        <div className="flex flex-wrap gap-2">
          <PillRow count={4} />
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
            <Block height={72} />
            <Block height={72} />
            <Block height={72} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {view === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <SkeletonLoader variant="text" width={160} height="1.2rem" />
                        <SkeletonLoader variant="text" width={96} height="0.9rem" />
                      </div>
                      <SkeletonLoader variant="rect" width={72} height={28} className="rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Block height={116} />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <Line width={72} />
                        <Line width={90} />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Line width={72} />
                        <Line width={64} />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Line width={72} />
                        <Line width={56} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SkeletonLoader variant="rect" width={72} height={32} className="rounded-md" />
                      <SkeletonLoader variant="rect" width={72} height={32} className="rounded-md" />
                      <SkeletonLoader variant="rect" width={84} height={32} className="rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hidden md:grid md:grid-cols-7 md:gap-3">
                {Array.from({ length: 7 }).map((_, index) => (
                  <SkeletonLoader key={index} variant="text" width="100%" height="1rem" />
                ))}
              </div>
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <div key={rowIndex} className="grid gap-3 rounded-lg border border-border bg-background p-4 md:grid-cols-7 md:items-center">
                  <div className="space-y-2 md:col-span-2">
                    <Line width={180} />
                    <Line width={110} />
                  </div>
                  <Line width={100} />
                  <Line width={100} />
                  <Line width={88} />
                  <SkeletonLoader variant="rect" width={80} height={28} className="rounded-full" />
                  <div className="flex gap-2">
                    <SkeletonLoader variant="rect" width={56} height={32} className="rounded-md" />
                    <SkeletonLoader variant="rect" width={56} height={32} className="rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Line width={120} />
        <div className="flex gap-2">
          <SkeletonLoader variant="rect" width={84} height={36} className="rounded-md" />
          <SkeletonLoader variant="rect" width={84} height={36} className="rounded-md" />
          <SkeletonLoader variant="rect" width={84} height={36} className="rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function InventoryDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonLoader variant="rect" width={120} height={36} className="rounded-lg" />
            <SkeletonLoader variant="rect" width={86} height={28} className="rounded-full" />
          </div>
          <Line width={360} />
        </div>
        <div className="flex gap-2">
          <SkeletonLoader variant="rect" width={92} height={36} className="rounded-md" />
          <SkeletonLoader variant="rect" width={92} height={36} className="rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader className="space-y-3">
            <Line width={220} />
            <Line width={140} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-border bg-muted/20 p-3">
                  <Line width={88} />
                  <Line width={index % 2 === 0 ? 120 : 96} />
                </div>
              ))}
            </div>
            <Block height={180} />
            <Block height={96} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="space-y-2">
              <Line width={180} />
              <Line width={120} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Block height={44} />
                <Block height={44} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Block height={44} />
                <Block height={44} />
              </div>
              <Block height={40} />
              <Block height={40} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <Line width={160} />
              <Line width={220} />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Block key={index} height={34} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function InventoryAuditSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <Line width={180} />
          <Line width={420} />
        </div>
        <div className="flex gap-2">
          <SkeletonLoader variant="rect" width={112} height={36} className="rounded-md" />
          <SkeletonLoader variant="rect" width={96} height={36} className="rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader className="space-y-2">
            <Line width={150} />
            <Line width={280} />
          </CardHeader>
          <CardContent className="space-y-4">
            <Block height={44} />
            <Block height={44} />
            <Block height={44} />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <Line width={180} />
                      <Line width={110} />
                    </div>
                    <SkeletonLoader variant="rect" width={64} height={28} className="rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <Line width={180} />
            <Line width={120} />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border bg-muted/10 p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <Line width={200} />
                      <Line width={140} />
                    </div>
                    <SkeletonLoader variant="rect" width={64} height={28} className="rounded-full" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Block height={44} />
                    <Block height={44} />
                  </div>
                  <Block height={44} />
                </div>
              </div>
            ))}

            <Block height={96} />
            <div className="flex flex-wrap gap-2">
              <SkeletonLoader variant="rect" width={120} height={40} className="rounded-md" />
              <SkeletonLoader variant="rect" width={96} height={40} className="rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function InventorySyncSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Line width={180} />
        <Line width={320} />
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <Line width={160} />
          <Line width={220} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border bg-muted/20 p-3">
                <Line width={84} />
                <Line width={index === 0 ? 140 : 96} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <SkeletonLoader variant="rect" width={188} height={40} className="rounded-md" />
            <SkeletonLoader variant="rect" width={132} height={40} className="rounded-md" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <Line width={160} />
          <Line width={240} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} variant="rect" width={index % 2 === 0 ? 92 : 110} height={28} className="rounded-full" />
            ))}
          </div>
          <Block height={120} />
        </CardContent>
      </Card>
    </div>
  );
}
