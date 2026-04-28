import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("./src/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({
        data: {
          user: {
            id: "test-user-id",
          },
        },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn(async () => ({
        data: [],
        error: null,
      })),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn(async () => ({
        error: null,
      })),
    })),
  },
}));