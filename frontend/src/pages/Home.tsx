import { Link } from "@tanstack/react-router"
import { Group, Heading, List, Text } from "lism-css/react"

export function Home() {
  return (
    <div>
      <Heading>Welcome to Loco</Heading>
      <Group as="nav">
        <List>
          {/* scaffold:nav */}
        </List>
      </Group>
      <Text>
        <Link to="/login">Log in</Link> or{' '}
        <Link to="/register">sign up</Link> to get started.
      </Text>
    </div>
  )
}
