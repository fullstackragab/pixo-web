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
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What Bixo Is</h2>
              <p className="text-gray-700">
                Bixo is a platform that helps companies discover qualified candidates through curated shortlists.
                We provide introductions between companies and candidates. We are not a recruiting agency and
                do not guarantee hiring outcomes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">For Candidates</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-3">
                <li>
                  <strong>No obligations:</strong> Being included in a shortlist does not obligate you to respond,
                  interview, or accept any opportunity. You are free to decline or ignore any outreach.
                </li>
                <li>
                  <strong>Accurate information:</strong> You agree to provide accurate information about your
                  skills, experience, and availability. Misrepresentation may result in removal from the platform.
                </li>
                <li>
                  <strong>Profile visibility:</strong> You control whether your profile is visible to companies.
                  You can hide your profile at any time.
                </li>
                <li>
                  <strong>Free to use:</strong> Bixo is free for candidates. We never charge candidates for
                  access to opportunities.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">For Companies</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-3">
                <li>
                  <strong>Shortlist access:</strong> Companies pay for access to curated shortlists of candidates.
                  Payment is based on shortlist delivery, not hiring outcomes.
                </li>
                <li>
                  <strong>No guarantees:</strong> Bixo does not guarantee that candidates will respond, interview,
                  or accept offers. Candidates retain full autonomy over their decisions.
                </li>
                <li>
                  <strong>Respectful outreach:</strong> Companies agree to communicate professionally with
                  candidates and respect their decisions.
                </li>
                <li>
                  <strong>Outcome-based pricing:</strong> We only charge when we successfully deliver a shortlist.
                  If we cannot find suitable candidates, you are not charged.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Are Not Responsible For</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-3">
                <li>
                  <strong>Hiring decisions:</strong> Decisions about who to interview, hire, or work with are
                  made entirely by companies and candidates. Bixo facilitates introductions only.
                </li>
                <li>
                  <strong>Employment disputes:</strong> Any disputes arising from employment relationships are
                  between the company and candidate, not Bixo.
                </li>
                <li>
                  <strong>Candidate decisions:</strong> Candidates may decline opportunities for any reason.
                  Bixo cannot compel candidates to respond or engage.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-3">
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You agree not to share account access with others</li>
                <li>You agree not to use the platform for spam, harassment, or fraudulent purposes</li>
                <li>We may suspend or terminate accounts that violate these terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to These Terms</h2>
              <p className="text-gray-700">
                We may update these terms from time to time. If we make significant changes, we will notify
                you through the platform. Continued use of Bixo after changes constitutes acceptance of
                the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
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
