import Link from 'next/link';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';

export default function TermsOfServicePage() {
  return (
    <PageWrapper>
      <PageContainer variant="default" verticalPadding="lg">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block">
            &larr; Back to Home
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

          <div className="prose prose-gray max-w-none space-y-8">
            <p className="text-gray-600 text-lg">
              Last updated: December 2024
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About Bixo</h2>
              <p className="text-gray-700">
                &ldquo;Bixo&rdquo; refers to the Bixo platform, operated by its founder. Bixo connects
                companies with qualified candidates through curated shortlists. We provide introductions
                only &mdash; we are not a recruiting agency and do not guarantee any hiring outcomes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What Bixo Does</h2>
              <p className="text-gray-700 mb-4">
                Bixo helps companies discover talent by creating curated shortlists of candidates who
                match their needs. Our service is outcome-based: companies only pay when we successfully
                deliver a shortlist of qualified candidates.
              </p>
              <p className="text-gray-700">
                We facilitate introductions between companies and candidates. What happens after an
                introduction &mdash; whether that leads to interviews, offers, or employment &mdash; is
                entirely between the company and the candidate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">No Hiring Guarantees</h2>
              <p className="text-gray-700">
                Bixo does not guarantee that any candidate will respond to outreach, attend an interview,
                or accept an offer. Candidates have full autonomy over their decisions. Similarly, we do
                not guarantee that a company will extend an offer to any candidate. We provide the
                introduction &mdash; the rest is up to both parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">No Employment Relationship</h2>
              <p className="text-gray-700">
                Bixo is not an employer, staffing agency, or recruiter. There is no employment
                relationship between Bixo and any candidate. Any employment relationship that forms is
                directly between the company and the candidate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">For Candidates</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-3">
                <li>
                  Bixo is free for candidates. We never charge you for access to opportunities.
                </li>
                <li>
                  Being included in a shortlist does not obligate you to respond, interview, or
                  accept any opportunity. You can decline or ignore any outreach.
                </li>
                <li>
                  You agree to provide accurate information about your experience and availability.
                </li>
                <li>
                  You control your profile visibility and can hide your profile at any time.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">For Companies</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-3">
                <li>
                  Companies pay for access to curated shortlists, not for hiring outcomes.
                </li>
                <li>
                  Shortlists are outcome-based: if we cannot find suitable candidates, you are not charged.
                </li>
                <li>
                  Payments may be coordinated manually during our early-access period.
                </li>
                <li>
                  Companies agree to communicate respectfully with candidates.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700">
                Bixo provides a platform for introductions. We are not responsible for hiring decisions,
                employment disputes, or any outcomes that result from connections made through the platform.
                We do our best to curate quality matches, but we cannot guarantee results. Use of Bixo
                is at your own discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acceptable Use</h2>
              <p className="text-gray-700 mb-4">
                When using Bixo, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Keep your account credentials secure</li>
                <li>Provide accurate information</li>
                <li>Not use the platform for spam, harassment, or fraud</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We reserve the right to suspend or remove accounts that misuse the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to These Terms</h2>
              <p className="text-gray-700">
                We may update these terms as Bixo evolves. If we make significant changes, we will
                notify you through the platform. Continued use of Bixo after changes means you accept
                the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions</h2>
              <p className="text-gray-700">
                If you have questions about these terms, please{' '}
                <Link href="/support" className="text-blue-600 hover:text-blue-700">
                  contact us
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </PageContainer>
    </PageWrapper>
  );
}
