import Link from 'next/link';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';

export default function PrivacyPolicyPage() {
  return (
    <PageWrapper>
      <PageContainer variant="default" verticalPadding="lg">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-6 inline-block">
            &larr; Back to Home
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

          <div className="prose prose-gray max-w-none space-y-8">
            <p className="text-gray-600 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Collect</h2>
              <p className="text-gray-700 mb-4">
                Bixo collects information you provide directly when creating an account and using our platform:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Account information:</strong> Email address and password</li>
                <li><strong>Profile information:</strong> Name, location preferences, job preferences, and availability status</li>
                <li><strong>CV/Resume:</strong> Documents you upload to help companies understand your experience</li>
                <li><strong>Skills:</strong> Technical skills extracted from your CV or added manually</li>
                <li><strong>Usage data:</strong> How you interact with the platform to improve matching</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Why We Collect It</h2>
              <p className="text-gray-700 mb-4">
                We use your information solely to operate the Bixo platform:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Matching:</strong> To connect candidates with relevant opportunities through shortlists</li>
                <li><strong>Communication:</strong> To facilitate introductions between candidates and companies</li>
                <li><strong>Platform improvement:</strong> To understand how to make Bixo more useful</li>
                <li><strong>Support:</strong> To respond to questions and resolve issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Who Can See Your Information</h2>
              <p className="text-gray-700 mb-4">
                Your profile visibility is under your control:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>When your profile is visible:</strong> Companies can see your profile in talent searches</li>
                <li><strong>When included in a shortlist:</strong> The company that requested that shortlist can view your full profile</li>
                <li><strong>When your profile is hidden:</strong> Your information is not shown to any companies</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You can change your visibility at any time from your profile settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Do Not Do</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We do not sell your data to third parties</li>
                <li>We do not use your data for advertising</li>
                <li>We do not share your information with recruiters or agencies without your consent</li>
                <li>We do not contact you about opportunities you have not opted into</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700">
                We use industry-standard security measures to protect your information, including encrypted
                connections (HTTPS), secure data storage, and access controls. CVs and sensitive documents
                are stored securely and only accessible to authorized parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have control over your data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Access:</strong> You can view all information we have about you in your profile</li>
                <li><strong>Correction:</strong> You can update your information at any time</li>
                <li><strong>Deletion:</strong> You can request deletion of your account and data by contacting support</li>
                <li><strong>Visibility:</strong> You can hide your profile at any time to stop appearing in searches</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
              <p className="text-gray-700">
                If you have questions about this policy or your data, please{' '}
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
