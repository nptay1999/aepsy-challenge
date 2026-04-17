export default function Footer() {
  return (
    <footer className="bg-primary h-60 px-6 py-12 mt-auto">
      <div className="mx-auto max-w-6xl">
        {/* Main row: logo+tagline left, social right */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-serif text-2xl text-white">Aepsy</span>
            <p className="text-sm text-white/70">Find the right therapist for you</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/in/ph%C6%B0%C6%A1ng-t%C3%A2y-nguy%E1%BB%85n-bab249228/"
              aria-label="LinkedIn"
              className="text-white/70 transition-colors hover:text-white"
              target="__blank"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-5"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-white/10" />

        {/* Copyright */}
        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} Nguyen Phuong Tay. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
