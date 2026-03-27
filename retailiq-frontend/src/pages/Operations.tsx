import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { routes } from '@/routes/routes';

const hubCards = [
  {
    title: 'Developer Platform',
    description: 'Manage API keys, webhooks, usage, logs, and rate limits.',
    to: routes.developer,
  },
  {
    title: 'KYC',
    description: 'Review providers, verification status, and compliance steps.',
    to: routes.kyc,
  },
  {
    title: 'Team',
    description: 'Check team service connectivity and operational readiness.',
    to: routes.team,
  },
  {
    title: 'Maintenance',
    description: 'Monitor scheduled maintenance and live incidents.',
    to: routes.ops,
  },
];

export default function OperationsPage() {
  return (
    <PageFrame
      title="Operations"
      subtitle="Central navigation for developer, KYC, team, and maintenance workflows."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {hubCards.map((card) => (
          <Link key={card.to} to={card.to} className="group block rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Card className="h-full transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">{card.description}</p>
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Open {card.title}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
