import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="bg-[#135d54] text-white rounded-2xl p-6 sm:p-9 flex flex-col justify-between shadow-sm">
      <div>
        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
          A better way to get
          <br />
          there.
        </h1>

        {/* Subtitle */}
        <p className="mt-3.5 text-xs sm:text-sm text-teal-50/90 leading-relaxed">
          Your next journey starts with a car and a host you can trust.
        </p>

        {/* Featured Vehicle Image */}
        <div className="mt-6 overflow-hidden rounded-xl">
          <Image
            src="/yaris.webp"
            alt="White Toyota Yaris parked on a street"
            width={800}
            height={520}
            preload
            className="w-full h-auto object-cover rounded-xl"
          />
        </div>
      </div>

      {/* Bottom Highlight Pill */}
      <div className="mt-6">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#f9ebd2] text-[#7c5317] text-xs font-medium">
          Verified hosts. Clear pricing.
        </span>
      </div>
    </section>
  );
}
