const stats = [
  { value: '$3.8 B', label: '24h trading volume' },
  { value: '350+', label: 'Cryptocurrencies' },
  { value: '1.2 M', label: 'Registered users' },
];

const StatsSection = () => {
  return (
    <section className="py-16 lg:py-20 border-y border-border bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="stat-number">{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
