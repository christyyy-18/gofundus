'use client';

const programs = [
  { name: 'Education', image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80' },
  { name: 'Health', image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80' },
  { name: 'Family', image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=900&q=80' },
];

const stats = [
  { label: 'Families helped', value: '12k+' },
  { label: 'Active donors', value: '4.8k' },
  { label: 'Community projects', value: '240' },
];

const quickTags = ['Education', 'Healthcare', 'Child welfare', 'Youth support'];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#141414] px-3 py-5 md:px-6 md:py-8">
      <div className="mx-auto max-w-[1220px] rounded-[42px] bg-[#2f2f2f] p-3 shadow-[0_50px_90px_rgba(0,0,0,0.38)] md:p-4">
        <div className="rounded-[34px] bg-[#f7f1ea] p-3 md:p-5">
          <header className="mb-8 flex items-center justify-between px-2 md:px-4">
            <div className="flex items-center gap-3 text-[#2d2a2a]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#cf9c5d] text-sm font-bold text-white shadow-sm">
                G
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#857b71]">Gainlove</div>
                <div className="text-[0.7rem] font-medium text-[#463f39]">Global justice network</div>
              </div>
            </div>

            <nav className="hidden items-center gap-7 text-[11px] font-medium uppercase tracking-[0.18em] text-[#655e57] md:flex">
              <a href="#" className="transition hover:text-[#1b1b1b]">Programs</a>
              <a href="#" className="transition hover:text-[#1b1b1b]">Stories</a>
              <a href="#" className="transition hover:text-[#1b1b1b]">Impact</a>
              <a href="#" className="transition hover:text-[#1b1b1b]">Contact</a>
            </nav>

            <button className="rounded-full bg-[#233e37] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_25px_rgba(35,62,55,0.22)] transition hover:-translate-y-0.5">
              Donate
            </button>
          </header>

          <main className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-7 px-2 md:px-4">
              <div className="inline-flex items-center rounded-full border border-[#e3cdb3] bg-[#fff9f3] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7d6b5a] shadow-sm">
                Compassion • clarity • impact
              </div>

              <div className="space-y-4">
                <h1 className="max-w-[560px] font-serif text-[3.2rem] leading-[0.9] tracking-[-0.08em] text-[#241f1d] sm:text-[4.3rem] lg:text-[5rem]">
                  Justice begins where inequality ends.
                </h1>
                <p className="max-w-[480px] text-base leading-7 text-[#5d564f] md:text-lg">
                  We help donors reach real community needs with transparency, trust, and beautiful, measurable change.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button className="rounded-full bg-[#2a5148] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_28px_rgba(42,81,72,0.22)] transition hover:-translate-y-0.5 hover:bg-[#23453d]">
                  Become a donor
                </button>
                <button className="rounded-full border border-[#d8c8b8] bg-white px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3f3732] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c39a68] hover:text-[#221f1d]">
                  See projects
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#e7d7c4] bg-[#fffaf4] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6a5c4d]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative px-2 md:px-4">
              <div className="animate-float relative mx-auto max-w-[480px] rounded-[30px] bg-[#f0e5d8] p-3 shadow-[0_30px_65px_rgba(79,62,42,0.12)]">
                <div className="absolute -left-10 top-10 h-24 w-24 rounded-full bg-[#d7b792]/70 blur-3xl" />
                <div className="absolute -right-8 top-12 h-28 w-28 rounded-full bg-[#f0cb7a]/70 blur-3xl" />
                <div className="absolute inset-x-14 bottom-4 h-20 rounded-full bg-[#f5e9d3]/80 blur-2xl" />

                <div className="relative overflow-hidden rounded-[24px] bg-[#f4ecdf] p-3">
                  <div className="mb-4 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#766d63]">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#c98c52]" />
                      <span>Gainlove</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d9c5a5]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d9c5a5]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d9c5a5]" />
                    </div>
                  </div>

                  <div className="relative flex items-start justify-between gap-3 px-1">
                    <div className="max-w-[175px] pt-2 text-[#2c2a2a]">
                      <p className="font-serif text-[2.5rem] leading-[0.8] tracking-[-0.07em]">
                        Justice
                        <span className="mt-1 block">begins where</span>
                        inequality
                        <span className="mt-1 block">ends</span>
                      </p>
                    </div>

                    <div className="relative mt-2 h-[185px] w-[175px]">
                      <div className="absolute inset-0 rounded-[28px] bg-[#dcc29e]/60 blur-[2px]" />
                      <div className="absolute inset-x-4 top-4 h-[128px] rounded-[30px] bg-[#f1d8a2] opacity-90" />
                      <div className="absolute inset-x-2 top-5 h-[145px] rounded-[28px] border-[6px] border-[#f5f0ea] bg-[#e6c9a8]" />
                      <div
                        className="absolute inset-x-3 top-7 h-[136px] rounded-[24px] bg-cover bg-center"
                        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=900&q=80)' }}
                      />
                      <div className="absolute -left-2 top-10 h-12 w-12 rounded-full bg-[#d26045] opacity-90" />
                      <div className="absolute -right-1 top-16 h-8 w-8 rounded-full bg-[#f2c261] opacity-90" />
                      <div className="absolute left-2 bottom-0 h-10 w-10 rounded-full bg-[#4fa8a6] opacity-80" />
                    </div>
                  </div>

                  <div className="relative z-10 mt-4 rounded-[18px] bg-[#f8f4f0] px-3 py-3 shadow-[0_8px_20px_rgba(99,79,56,0.07)]">
                    <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8d7f72]">
                      Our Programs
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {programs.map((program) => (
                        <div key={program.name} className="text-center transition duration-200 hover:-translate-y-1">
                          <div className="mb-2 overflow-hidden rounded-[12px] bg-[#e9d7c1] shadow-sm">
                            <div
                              className="h-16 w-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${program.image})` }}
                            />
                          </div>
                          <div className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#5e574f]">
                            {program.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-drift absolute -bottom-8 left-6 z-20 w-[61%] rounded-[18px] bg-white/90 p-3 shadow-[0_18px_34px_rgba(80,66,52,0.12)] backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full border-[3px] border-[#f2e8dc] bg-[#d8c5ad]">
                    <img
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
                      alt="Volunteer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8b7c6e]">Supporters</div>
                    <div className="mt-1 font-serif text-[1.5rem] leading-none tracking-[-0.06em] text-[#272320]">2020 fundraisers</div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <section className="mt-10 grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[22px] border border-[#eadfce] bg-[#fffaf5] p-5 shadow-[0_10px_30px_rgba(75,61,45,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(75,61,45,0.08)]"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7b6d]">{stat.label}</div>
                <div className="mt-3 font-serif text-[2.5rem] leading-none tracking-[-0.06em] text-[#1f1b1a]">{stat.value}</div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
