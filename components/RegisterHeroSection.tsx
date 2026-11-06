import Image from "next/image";

export default function RegisterHeroSection() {
  return (
    <section className="bg-[#e6f0ee] text-stone-900 rounded-2xl p-6 sm:p-9 flex flex-col justify-between shadow-sm">
      <div>
        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-[#135d54]">
          Make room for
          <br />
          your next adventure.
        </h1>

        {/* Featured Vehicle Image */}
        <div className="mt-6 overflow-hidden rounded-xl">
          <Image
            src="/hrv.webp"
            alt="Silver Honda HR-V parked in front of a modern house"
            width={800}
            height={520}
            preload
            className="w-full h-auto object-cover rounded-xl"
          />
        </div>

        {/* Subheadline & Description */}
        <h2 className="mt-6 text-lg sm:text-xl font-bold text-stone-900">
          One account. More possibilities.
        </h2>
        <p className="mt-2.5 text-xs sm:text-sm text-stone-500 leading-relaxed">
          Explore local cars, save your favourites, and manage every trip in one
          place.
        </p>
      </div>

      {/* Bottom Highlight Text */}
      <div className="mt-6 pt-1">
        <span className="inline-block px-2 py-1 text-[#135d54] text-xs font-medium">
          Join the Rentify community
        </span>
      </div>
    </section>
  );
}
