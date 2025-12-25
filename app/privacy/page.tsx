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
              Last updated: December 2024
            </p>

            <p className="text-gray-700">
              We process data for the purposes described below. This policy explains what information
              we collect, how we use it, and how you can control it.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide when creating an account and using Bixo:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Account information:</strong> Your email address and password
                </li>
                <li>
                  <strong>Profile information:</strong> Your name, location preferences, job preferences,
                  and availability status
                </li>
                <li>
                  <strong>CV and documents:</strong> Resumes or CVs you upload to showcase your experience
                </li>
                <li>
                  <strong>Skills:</strong> Technical and professional skills, either extracted from your
                  CV or added by you
                </li>
                <li>
                  <strong>Usage information:</strong> How you interact with the platform, to help us
                  improve matching and the overall experience
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use your information to operate Bixo and provide our services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Matching:</strong> To connect candidates with relevant opportunities
                  through curated shortlists
                </li>
                <li>
                  <strong>Communication:</strong> To facilitate introductions between candidates
                  and companies
                </li>
                <li>
                  <strong>Platform improvement:</strong> To understand how people use Bixo and
                  make it more useful
                </li>
                <li>
                  <strong>Support:</strong> To respond to your questions and help resolve issues
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">CV Storage</h2>
              <p className="text-gray-700">
                Your CV and documents are stored securely. We use industry-standard security measures
                including encrypted connections and secure storage. Your CV is only shared with companies
                when you are included in a shortlist for that company. We do not sell, rent, or trade
                your CV or documents to anyone.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Who Can See Your Information</h2>
              <p className="text-gray-700 mb-4">
                You control your profile visibility:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Visible profile:</strong> Companies can discover you in talent searches
                </li>
                <li>
                  <strong>In a shortlist:</strong> The requesting company can view your full profile
                </li>
                <li>
                  <strong>Hidden profile:</strong> Your information is not shown to any companies
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                You can change your visibility at any time from your profile settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Do Not Do</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We do not sell your data to third parties</li>
                <li>We do not use your information for advertising</li>
                <li>We do not share your data with recruiters or agencies without your knowledge</li>
                <li>We do not contact you about opportunities you have not opted into</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have control over your data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Access:</strong> You can view all information we have about you in your profile
                </li>
                <li>
                  <strong>Correction:</strong> You can update your information at any time
                </li>
                <li>
                  <strong>Deletion:</strong> You can request deletion of your account and data
                </li>
                <li>
                  <strong>Visibility:</strong> You can hide your profile to stop appearing in searches
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Questions</h2>
              <p className="text-gray-700">
                If you have questions about this policy, how your data is handled, or want to request
                deletion of your information, please{' '}
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
