---
title: "A fully featured React components library"
source: "https://mantine.dev/"
author:
published:
created: 2026-05-21
description: "A fully featured React components library with 120+ customizable components, hooks, and utilities. Build accessible web applications faster."
tags:
  - "Mantine UI"
---
Build fully functional accessible web applications faster than ever – Mantine includes more than 120 customizable components and 70 hooks to cover you in any situation

[Get Started](https://mantine.dev/getting-started/) [GitHub](https://github.com/mantinedev/mantine)

## Built for the AI-assisted workflow

LLM-optimized docs, agent skills for complex tasks, and an MCP server for direct API access — Mantine is designed to work with Cursor, Claude Code, Windsurf, and every AI coding tool you already use.

### LLM documentation

llms.txt and llms-full.txt files follow the LLMs.txt standard – use them with Cursor, Windsurf, ChatGPT, Claude, and other AI tools

```
# Reference Mantine docs in Cursor
@Docs https://mantine.dev/llms.txt

# Or download full documentation
curl -o mantine-docs.txt https://mantine.dev/llms-full.txt

# Use with ChatGPT/Claude
"Using Mantine, how do I create a dark mode toggle?
Reference: https://mantine.dev/llms.txt"
```

## 120+ components

Build your next app faster with high-quality, well-tested components. Mantine includes everything you need to create complex web applications with ease: custom select, date pickers, notifications, modals, and more.

## Hooks library

70+ hooks for handling tricky and common parts of your application

30

70

```
import { useState } from 'react';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import { clamp, useMove } from '@mantine/hooks';
import classes from './Demo.module.css';

function Demo() {
  const [value, setValue] = useState(0.3);
  const { ref } = useMove(({ x }) => setValue(clamp(x, 0.1, 0.9)));
  const labelFloating = value < 0.2 || value > 0.8;

  return (
    <div className={classes.root}>
      <div className={classes.track} ref={ref}>
        <div
          className={classes.filled}
          style={{
            width: \`calc(${value * 100}% - var(--thumb-width) / 2 - var(--thumb-offset) / 2)\`,
          }}
        >
          <span className={classes.label} data-floating={labelFloating || undefined} data-filled>
            {(value * 100).toFixed(0)}
          </span>
        </div>

        <div
          className={classes.empty}
          style={{
            width: \`calc(${(1 - value) * 100}% - var(--thumb-width) / 2 - var(--thumb-offset) / 2)\`,
          }}
        >
          <span className={classes.label} data-floating={labelFloating || undefined}>
            {((1 - value) * 100).toFixed(0)}
          </span>
        </div>

        <div
          className={classes.thumb}
          style={{ left: \`calc(${value * 100}% - var(--thumb-width) / 2)\` }}
        >
          <DotsSixVerticalIcon />
        </div>
      </div>
    </div>
  );
}
```

Resize me!

| Property | Value |
| --- | --- |
| width | 400 |
| height | 200 |

```
import { Group, Table } from '@mantine/core';
import { useResizeObserver } from '@mantine/hooks';

function Demo() {
  const [ref, rect] = useResizeObserver();

  return (
    <div className={classes.root}>
      <Group justify="center">
        <div ref={ref} className={classes.demo}>
          Resize me!
        </div>
      </Group>

      <Table
        captionSide="top"
        data={{
          caption: 'Resize element by dragging its right bottom corner',
          head: ['Property', 'Value'],
          body: [
            ['width', rect.width],
            ['height', rect.height],
          ],
        }}
      />
    </div>
  );
}
```

Ctrl

+

K

– Open search

Ctrl

+

J

– Toggle color scheme

```
import { useHotkeys } from '@mantine/hooks';
import { spotlight } from '@mantine/spotlight';
import { useMantineColorScheme } from '@mantine/core';
import { Shortcut } from './Shortcut';

function Demo() {
  const { toggleColorScheme } = useMantineColorScheme();

  useHotkeys([
    ['mod + K', () => spotlight.open()],
    ['mod + J', () => toggleColorScheme()],
    ['mod + shift + alt + X', () => secret()],
  ]);

  return (
    <>
      <Shortcut symbol="K" description="Open search" />
      <Shortcut symbol="J" description="Toggle color scheme" />
    </>
  );
}
```

Click the button to pick color

```
import { useState } from 'react';
import { ActionIcon, Group, ColorSwatch, Text } from '@mantine/core';
import { CrosshairIcon } from '@phosphor-icons/react';
import { useEyeDropper } from '@mantine/hooks';

function Demo() {
  const [color, setColor] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const { supported, open } = useEyeDropper();

  const pickColor = async () => {
    try {
      const { sRGBHex } = (await open())!;
      setColor(sRGBHex);
    } catch (e) {
      setError(e as Error);
    }
  };

  if (!supported) {
    return <Text ta="center">EyeDropper API is not supported in your browser</Text>;
  }

  return (
    <Group>
      <ActionIcon variant="default" onClick={pickColor} size="xl">
        <CrosshairIcon size={28} />
      </ActionIcon>
      {color ? (
        <Group gap="xs">
          <ColorSwatch color={color} />
          <Text>Picked color: {color}</Text>
        </Group>
      ) : (
        <Text>Click the button to pick color</Text>
      )}
      {error && <Text c="red">Error: {error?.message}</Text>}
    </Group>
  );
}
```

## Flexible styling

Mantine components are built with native CSS – styles are performant and easy to override

### Built with CSS

Mantine styles are exposed as.css files – styles are performant and do not have any runtime overhead

### Compatible with any styling solution

You can bring your own library to style Mantine components (Emotion, Vanilla Extract, Sass, etc.) – you are not limited to any specific tool

```
.root {
  border-top-left-radius: var(--mantine-radius-xl);
  border-bottom-left-radius: var(--mantine-radius-xl);
  padding-left: 4px;

  /* The following styles will be applied only when button is disabled */
  &[data-disabled] {
    /* You can use Mantine PostCSS mixins inside data attributes */
    @mixin light {
      border: 1px solid var(--mantine-color-gray-2);
    }

    @mixin dark {
      border: 1px solid var(--mantine-color-dark-4);
    }

    /* You can target child elements that are inside .root[data-disabled] */
    & .section[data-position='left'] {
      opacity: 0.6;
    }
  }
}

.section {
  /* Apply styles only to left section */
  &[data-position='left'] {
    --section-size: calc(var(--button-height) - 8px);

    background-color: var(--mantine-color-body);
    color: var(--mantine-color-text);
    height: var(--section-size);
    width: var(--section-size);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--mantine-radius-xl);
  }

  &[data-position='right'] {
    @mixin rtl {
      transform: rotate(180deg);
    }
  }
}
```

## Dark color scheme

![](https://mantine.dev/_next/static/media/new.02k-7~y.gsuf7.webp)

Add dark theme to your application with just a few lines of code – Mantine exports global styles both for light and dark theme, all components support dark theme out of the box.

```
import { MantineProvider } from '@mantine/core';

function Demo() {
  return (
    <MantineProvider defaultColorScheme="dark">
      <App />
    </MantineProvider>
  );
}
```

## Combobox component

Combobox is a composable component which can be used to create custom select, multiselect, autocomplete, tags input and other similar components. It provides a lot of flexibility and gives you full control over the UI and behavior while keeping your codebase clean and simple.

## Extensions

Extensions are additional packages that provide extra functionality to Mantine, such as rich text editor, notifications system, charts, modals manager and more. They are built to be easily integrated into your application and provide a seamless experience.

## Welcome to Mantine rich text editor

`RichTextEditor` component focuses on usability and is designed to be as simple as possible to bring a familiar editing experience to regular users. `RichTextEditor` is based on [Tiptap.dev](https://tiptap.dev/) and supports all of its features:

- General text formatting: **bold**, *italic*, underline, ~~strike-through~~
- Headings (h1-h6)
- Sub and super scripts (<sup>&lt;sup /&gt;</sup> and <sub>&lt;sub /&gt;</sub> tags)
- Ordered and bullet lists
- Text align
- And all [other extensions](https://tiptap.dev/extensions)

## Form library

@mantine/form – performant form library designed for Mantine components. Works out of the box with all Mantine inputs.

```
import { Button, Checkbox, Group, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

function Demo() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      termsOfService: false,
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      <TextInput
        withAsterisk
        label="Email"
        placeholder="your@email.com"
        key={form.key('email')}
        {...form.getInputProps('email')}
      />

      <Checkbox
        mt="md"
        label="I agree to sell my privacy"
        key={form.key('termsOfService')}
        {...form.getInputProps('termsOfService', { type: 'checkbox' })}
      />

      <Group justify="flex-end" mt="md">
        <Button type="submit">Submit</Button>
      </Group>
    </form>
  );
}
```

Build even faster with Mantine UI

## 120+ responsive components built with Mantine

Build your next website even faster with premade responsive components designed and built by Mantine maintainers and community. All components are free forever for everyone.

[Explore components](https://ui.mantine.dev/)

## Trusted by thousands of developers

30,000+ GitHub stars, 5M+ monthly downloads, 500+ contributors. Mantine is built in the open and shaped by the developers who use it every day.

[One of the best UI libraries I've come across.](https://github.com/orgs/mantinedev/discussions/5783)

I am a senior Frontend Developer and wanted to use something new instead of Material UI and came across this, it has been well thought of all the different scenarios you and come across, and the hooks are just pure love:)

Thank you so much for this.

[You nailed it!](https://github.com/orgs/mantinedev/discussions/6150)

Man, I've been doing Front-End for 20 years. This is, hands-down, the best component library I've ever used. What's more, the parts that I didn't like (Styling from JS Objects, slow with big forms) have been addressed in v7. Please keep it up, this library deserves more exposure, it just works and works well and beautifully. Many thanks to [@rtivital](https://github.com/rtivital) and the contributors!

[Absurdly good](https://github.com/orgs/mantinedev/discussions/5504)

Hope this kind of post is ok - just wanted to say thank you.

I've been writing software professionally for 25 years, with the last 15 in web (mostly internal projects in my company). This is easily the best component library I've ever used.

In every other instance I've run into the boundaries of what the library does and have to spend a lot of time and energy customizing or extending it. Not only does Mantine provide easy access to everything under the hood, but 99% the things you need are provided as default options. I've started to lose count of the "guess I'd better build my standard xyz... oh wait, they have that too" moments. Also the docs are perfect.

Bravo, thank you.

[Thank you mantine 💘](https://github.com/orgs/mantinedev/discussions/3741)

Dear Mantine Team, thank you for putting this library together. I have started to use and love Mantine in my free time, and bringing this great library to good use in our company now. All the developers are very pleased with the development experience, the time savings for any bigger project is insane. The amount of flexibility we have with our designers and developers will result in great products. All thanks to every contributor. Continue the good work!

[A solution for every problem](https://github.com/orgs/mantinedev/discussions/5456)

Mantine has a solution for every problem I’ve needed to solve in my web app. Components and props are named clearly, design choices promote simplicity, and it looks beautiful out of the box. Thank you for jump starting my application in a big way!

[Thank you Mantine!](https://github.com/orgs/mantinedev/discussions/259)

Out of all react component libraries that I have ever seen this one is the most straight forward, easy to use, well documented and really beautiful. I plan on switching and using this full time. Just wanted to say huge thanks to the people that made this.

## Ready to get started?

Mantine can be used with any modern React framework or build tool: get started with Next.js, Vite, React Router and other tools in minutes by following the installation guide or using one of the available templates.