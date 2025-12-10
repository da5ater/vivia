# Fixing Logo Cropping in Circular Avatars

```yaml
---
aliases:
  - Avatar Logo Fix
  - CSS Object Fit Guide
  - React Component Flexibility
backlinks:
  - "[[CSS]]"
  - "[[React Components]]"
  - "[[Tailwind CSS]]"
  - "[[Frontend Engineering]]"
---
```

## Handling Aspect Ratio in Reusable Avatar Components

### Notes

- **Context**: The `DiceBearAvatar` component was originally designed for procedural avatars (DiceBear) or standard user profile pictures, which typically fill the entire frame.
- **Problem Identification**: When repurposing the component to display a static application logo (e.g., `vivia-logo.png`), the logo appeared cropped.
  - The component enforced a circular shape using `rounded-full`.
  - The image tag utilized `object-cover`, forcing the image to fill the container's dimensions completely.
  - **Result**: The corners of the square/rectangular logo were clipped by the circular border radius.
- **Technical Solution**:
  - **Component Level**: Modified `DiceBearAvatar` to accept an optional `imageClassName` prop. This allows consumers to inject specific CSS classes into the underlying `<img>` element, overriding or augmenting default styles.
  - **Implementation Level**: In `WidgetChatScreen`, passed `object-contain` and `p-1` via the new prop.
    - `object-contain`: Ensures the entire image scales down to fit within the container without being clipped, preserving its aspect ratio.
    - `p-1`: Adds padding to ensure the logo doesn't touch the container edges, improving visual balance.
- **Key Takeaway**: Reusable UI components must avoid hardcoding layout-restrictive styles (like `object-cover`) without providing an escape hatch for overrides.

#### Definitions

- **Object-Fit**: A CSS property that sets how the content of a replaced element, such as an `<img>` or `<video>`, should be resized to fit its container.
- **Prop Drilling**: (In this context, avoided) Passing data through multiple layers. Here, we simply exposed a prop to the immediate child.

### Code Implementation

```tsx
// File: packages/ui/src/components/DiceBearAvatar.tsx

import { cn } from "@workspace/ui/lib/utils";
// ... imports

interface DiceBearAvatarProps {
  seed: string;
  size?: number;
  className?: string;
  badgeClassName?: string;
  imageUrl?: string;
  badgeImageUrl?: string;
  // 1. Extension Point: Added prop to allow image-specific styling overrides
  imageClassName?: string;
}

export const DiceBearAvatar = ({
  seed,
  size = 32,
  className,
  badgeClassName,
  imageUrl,
  badgeImageUrl,
  imageClassName,
}: DiceBearAvatarProps) => {
  // ... memoization logic

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <Avatar
        className={cn("overflow-hidden rounded-full border", className)}
        style={{ width: size, height: size }}
      >
        {/* 
            2. Class Merging: We use 'cn' (clsx + tailwind-merge) to combine defaults with the new prop.
            'object-cover' is the default, but passing 'object-contain' in imageClassName 
            will correctly override it due to tailwind-merge's specificity handling.
        */}
        <AvatarImage
          src={imageUrl || avatarSource}
          alt="Avatar"
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      </Avatar>

      {/* ... badge logic */}
    </div>
  );
};
```

> [!question] Interview Question
> **Q:** Why is `tailwind-merge` (used inside `cn`) critical here when we have both `object-cover` and `object-contain`?
>
> > [!info] Answer
> > **A:** Standard CSS cascades based on definition order, not class name order in the HTML attribute. If both classes are present, the one defined later in the stylesheet wins. `tailwind-merge` detects conflicting Tailwind classes (like `object-fit` utilities) and ensures only the _last_ one passed to the function remains in the final string, guaranteeing the override works as expected.

```tsx
// File: apps/widget/modules/widget/ui/screens/WidgetChatScreen.tsx

// ... inside component render
{
  message.role === "assistant" && (
    <DiceBearAvatar
      seed="assistant"
      imageUrl="/vivia-logo.png"
      // 3. Usage: Applying the fix
      // object-contain: Fits image inside the circle
      // p-1: Adds padding so corners don't touch the border
      imageClassName="object-contain p-1"
    />
  );
}
```

### Thinking Model

> [!thinking model] The Picture Frame Analogy
> Imagine you have a round picture frame and a square photo.
>
> - **`object-cover` (The Default)**: You cut the photo into a circle to fill the frame completely. You lose the corners of the photo.
> - **`object-contain` (The Fix)**: You shrink the square photo until it fits entirely _inside_ the round frame. You see the whole photo, but there is empty space (background) between the photo edges and the frame.

### Recall Cues

> [!question] Recall Cues
>
> - What CSS property causes an image to be clipped if its container has a different aspect ratio?
> - How does `object-contain` differ from `object-cover` in the context of a circular container?
> - Why is it important to expose `className` props for internal elements of a complex UI component?
> - What utility library helps resolve conflicting Tailwind classes?

### Reflections

- **Component Design**: Rigid components that enforce specific visual styles (like `object-cover`) often fail when content types change (e.g., from faces to logos). Always provide "escape hatches" like `className` props.
- **CSS Geometry**: A circle (`rounded-full`) is the most aggressive clipping mask. Rectangular content inside a circle requires careful padding and scaling (`object-contain`) to remain legible.
- **Maintenance**: By adding the prop to the component definition rather than creating a separate "LogoAvatar" component, we preserved the DRY (Don't Repeat Yourself) principle and kept the codebase lean.
