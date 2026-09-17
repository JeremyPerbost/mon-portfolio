import { fireEvent, render, screen } from '@testing-library/react';
import ProjectGallery from './ProjectGallery';

const projects = [
  { title: 'Pebble Beach', href: 'https://github.com/example/golf', tagline: 'Mega Drive', description: 'Reconstruction du jeu.', stack: ['68000'] },
  { title: 'Memory', href: 'https://play.google.com/store/apps/details?id=memory', tagline: 'Android', description: 'Jeu de mémoire.', stack: ['Godot'] },
];

function setup() {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  render(<ProjectGallery projects={projects} />);
  const track = screen.getByLabelText(/Projets : utilisez/);
  Object.defineProperty(track, 'clientWidth', { value: 800 });
  track.scrollTo = jest.fn(({ left }) => {
    track.scrollLeft = left;
    fireEvent.scroll(track);
  });
  return track;
}

test('navigates projects without wrapping past either end', () => {
  const track = setup();
  expect(screen.getByRole('button', { name: 'Projet précédent' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Projet suivant' }));
  expect(track.scrollTo).toHaveBeenCalledWith({ left: 800, behavior: 'instant' });
  expect(screen.getByRole('button', { name: 'Projet suivant' })).toBeDisabled();
  expect(screen.getByText('02')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Projet précédent' }));
  expect(screen.getByRole('button', { name: 'Projet précédent' })).toBeDisabled();
});

test('supports keyboard navigation and keeps inactive links out of the tab sequence', () => {
  const track = setup();
  const slides = screen.getAllByRole('group');
  expect(slides[1]).toHaveAttribute('inert');
  fireEvent.keyDown(track, { key: 'End' });
  expect(slides[0]).toHaveAttribute('inert');
  expect(slides[1]).not.toHaveAttribute('inert');
  fireEvent.keyDown(track, { key: 'Home' });
  expect(slides[0]).not.toHaveAttribute('inert');
});

test('uses the right destination label and announces a new tab', () => {
  setup();
  expect(screen.getByRole('link', { name: /Explorer sur GitHub/ })).toHaveAttribute('href', projects[0].href);
  expect(screen.getByRole('link', { name: /Découvrir sur Google Play/ })).toHaveAttribute('target', '_blank');
  expect(screen.getByRole('link', { name: /Explorer sur GitHub/ })).toHaveAccessibleName(/nouvel onglet/);
});
