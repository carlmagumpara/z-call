import { createElement } from 'react';

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <article className="rounded-20 border border-stroke-faint bg-feature-bg p-7 text-left backdrop-blur-md transition-all duration-250 ease-in-out hover:-translate-y-1 hover:border-accent/50 hover:bg-feature-hover-bg">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-feature-icon text-xl text-violet-300">
        {createElement(Icon)}
      </span>
      <h2 className="mb-2 mt-5 text-[1.1rem] font-650">{title}</h2>
      <p className="m-0 text-[0.92rem] leading-[1.6] text-muted">{text}</p>
    </article>
  );
}

export default FeatureCard;
